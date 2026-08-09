import AppError from '../../errors/AppError';
import * as ShopRepository from './shop.repository';
import { hasAnyRole } from '@gremio-estelar/shared';
import prisma from '../../database/prisma';
import { trackMissionProgress } from '../ecosystem/missions.service';

// ─── Consumable helpers (shared by buy/use/refund) ───

const CONSUMABLE_TYPES = ['NAME_CHANGE', 'PIN_POST', 'BOOSTER_2X', 'ROULETTE_TOKEN', 'STREAK_SAVER', 'GUILD_XP_CRYSTAL', 'GLOBAL_MEGAPHONE', 'SUPER_BOOST_POST'];
// PIN_POST is the only multi-use consumable (3 uses); all others are single-use.
const MULTI_USE_TYPES = new Set(['PIN_POST']);

const isConsumableType = (type: string) => CONSUMABLE_TYPES.includes(type);
const getInitialUses = (type: string) => (MULTI_USE_TYPES.has(type) ? 3 : 1);

// ─── List shop items ───

let hasSeeded = false;
let shopItemsCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 1000; // 1 minute memory cache

export const invalidateShopItemsCache = () => {
  shopItemsCache = null;
};

export const listItems = async () => {
  // Return cached shop items if fresh
  if (shopItemsCache && Date.now() - shopItemsCache.timestamp < CACHE_TTL_MS) {
    return shopItemsCache.data;
  }

  // Asynchronously seed default items once in background if not done yet.
  // Si el seed falla, se resetea hasSeeded para reintentarlo en la próxima
  // petición (antes quedaba marcado como hecho para siempre).
  if (!hasSeeded) {
    hasSeeded = true;
    seedDefaultItems().catch(() => {
      hasSeeded = false;
    });
  }

  const items = await ShopRepository.findActiveItems();
  shopItemsCache = { data: items, timestamp: Date.now() };
  return items;
};

// ─── Get user inventory ───

export const getInventory = async (userId: string) => {
  return ShopRepository.findUserPurchases(userId);
};

// ─── Get public equipped items for a user (for profile display) ───

export const getPublicEquipped = async (userId: string) => {
  return ShopRepository.findEquippedItems(userId);
};

// ─── Buy an item (paid with Stardust) ───

export const buyItem = async (userId: string, itemId: string) => {
  const item = await ShopRepository.findItemById(itemId);
  if (!item) throw new AppError('Ítem no encontrado', 404);
  if (!item.active) throw new AppError('Este ítem ya no está disponible', 400);

  // Calculate effective price with discount if set by admin
  let effectivePrice = item.price;
  if (item.data) {
    try {
      const parsed = JSON.parse(item.data);
      if (parsed.discountPercent && parsed.discountPercent > 0) {
        effectivePrice = Math.max(0, Math.round(item.price * (1 - parsed.discountPercent / 100)));
      }
    } catch {}
  }

  // Check user stardust balance
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stardust: true },
  });
  if (!user) throw new AppError('Usuario no encontrado', 404);

  if (user.stardust < effectivePrice) {
    throw new AppError(
      `No tienes suficiente Stardust. Necesitas ⭐ ${effectivePrice.toLocaleString()}, tienes ⭐ ${user.stardust.toLocaleString()}.`,
      400
    );
  }

  const type = item.type;
  const isConsumable = isConsumableType(type);

  // Cargo + entrega del ítem en UNA transacción: el débito de Stardust y la
  // creación/actualización de la compra deben commitearse o revertirse juntos.
  // Antes, si fallaba el paso intermedio, el usuario perdía Stardust sin ítem
  // (o recibía el ítem sin pagar).
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { stardust: true, role: true },
    });
    if (!user) throw new AppError('Usuario no encontrado', 404);

    // Admins tienen Stardust infinito: no se les descuenta ni se les bloquea.
    const isAdmin = hasAnyRole(user.role, ['ADMIN']);
    if (!isAdmin && user.stardust < effectivePrice) {
      throw new AppError(
        `No tienes suficiente Stardust. Necesitas ⭐ ${effectivePrice.toLocaleString()}, tienes ⭐ ${user.stardust.toLocaleString()}.`,
        400
      );
    }

    const existing = await tx.userPurchase.findFirst({ where: { userId, itemId } });
    if (!isConsumable && existing) {
      throw new AppError('Ya tienes este ítem', 400);
    }

    let newBalance = user.stardust;
    if (!isAdmin) {
      // Decremento atómico condicional: solo descuenta si el saldo sigue siendo
      // suficiente, de modo que dos compras paralelas no puedan gastar el
      // mismo Stardust (evita saldos negativos / doble gasto).
      const debited = await tx.user.updateMany({
        where: { id: userId, stardust: { gte: effectivePrice } },
        data: { stardust: { decrement: effectivePrice } },
      });
      if (debited.count === 0) {
        const fresh = await tx.user.findUnique({
          where: { id: userId },
          select: { stardust: true },
        });
        throw new AppError(
          `No tienes suficiente Stardust. Necesitas ⭐ ${effectivePrice.toLocaleString()}, tienes ⭐ ${fresh?.stardust?.toLocaleString() ?? 0}.`,
          400
        );
      }
      await tx.stardustTransaction.create({
        data: {
          userId,
          amount: -effectivePrice,
          reason: `Compra en tienda: ${item.name}`,
        },
      });
      newBalance = user.stardust - effectivePrice;
    } else {
      newBalance = 999999999;
    }

    let purchase;
    if (isConsumable && existing) {
      const usesToAdd = getInitialUses(type);
      purchase = await tx.userPurchase.update({
        where: { id: existing.id },
        data: { remaining: (existing.remaining || 0) + usesToAdd },
        include: { item: true },
      });
    } else if (isConsumable) {
      purchase = await tx.userPurchase.create({
        data: { userId, itemId, remaining: getInitialUses(type) },
        include: { item: true },
      });
    } else {
      purchase = await tx.userPurchase.create({
        data: { userId, itemId },
        include: { item: true },
      });
    }

    return {
      purchase,
      balance: newBalance,
    };
  });
};

// ─── Equip/unequip an item ───

export const equipItem = async (userId: string, itemId: string) => {
  const purchase = await ShopRepository.findUserPurchase(userId, itemId);
  if (!purchase) throw new AppError('No tienes este ítem', 404);

  const type = purchase.item.type;
  if (isConsumableType(type)) {
    throw new AppError('Este ítem no se puede equipar. Úsalo desde tu inventario.', 400);
  }

  const isEquipping = !purchase.equipped;

  // If equipping, unequip all other items of the same type first
  if (isEquipping) {
    await ShopRepository.unequipAllByType(userId, type);
  }

  await ShopRepository.setItemEquipped(userId, itemId, isEquipping);
  if (isEquipping) {
    trackMissionProgress(userId, 'EQUIP_ITEM').catch(() => {});
  }

  return { equipped: isEquipping, type };
};

// ─── Use a consumable ───

export const useConsumable = async (userId: string, itemId: string) => {
  const purchase = await ShopRepository.findUserPurchase(userId, itemId);
  if (!purchase) throw new AppError('No tienes este ítem', 404);

  const type = purchase.item.type;
  if (!isConsumableType(type)) {
    throw new AppError('Este ítem no es de uso único', 400);
  }

  if (!purchase.remaining || purchase.remaining <= 0) {
    throw new AppError('No te quedan usos de este ítem', 400);
  }

  const newRemaining = purchase.remaining - 1;

  if (newRemaining <= 0) {
    await ShopRepository.deletePurchase(purchase.id);
  } else {
    await ShopRepository.updatePurchaseRemaining(purchase.id, newRemaining);
  }

  return { remaining: newRemaining, type };
};

// ─── Refund an item (returns 100% Stardust and removes purchase) ───

export const refundItem = async (userId: string, itemId: string) => {
  const purchase = await ShopRepository.findUserPurchase(userId, itemId);
  if (!purchase) throw new AppError('No posees este ítem en tu inventario', 404);

  const item = purchase.item;

  // Reject refunds of consumables that have already been used, otherwise users
  // could buy a multi-use item, consume most uses, refund it at full price and
  // repeat forever — an infinite Stardust farm.
  if (isConsumableType(item.type) && (purchase.remaining ?? 0) < getInitialUses(item.type)) {
    throw new AppError('No puedes reembolsar un consumible que ya fue usado.', 400);
  }

  let refundPrice = item.price;
  if (item.data) {
    try {
      const parsed = JSON.parse(item.data);
      if (parsed.discountPercent && parsed.discountPercent > 0) {
        refundPrice = Math.max(0, Math.round(item.price * (1 - parsed.discountPercent / 100)));
      }
    } catch {}
  }

  // Borrado + reembolso en UNA transacción: si fallara el paso intermedio,
  // antes el usuario perdía el ítem sin recuperar su Stardust (o viceversa).
  return prisma.$transaction(async (tx) => {
    await tx.userPurchase.delete({ where: { id: purchase.id } });
    const updated = await tx.user.update({
      where: { id: userId },
      data: { stardust: { increment: refundPrice } },
    });
    await tx.stardustTransaction.create({
      data: {
        userId,
        amount: refundPrice,
        reason: `Reembolso de ítem: ${item.name}`,
      },
    });

    return {
      success: true,
      refundedStardust: refundPrice,
      newBalance: updated.stardust,
      itemName: item.name,
    };
  });
};

// ─── Get equipped badge ───

export const getEquippedBadge = async (userId: string) => {
  return ShopRepository.findEquippedByType(userId, 'BADGE');
};

// ─── Seed default shop items ───

export const seedDefaultItems = async () => {
  const defaults = [
    // ── Badges ──
    { name: 'Estrella Dorada', description: 'Una insignia dorada que brilla en tu perfil', type: 'BADGE', price: 500, data: JSON.stringify({ icon: '⭐', color: '#ffd700', label: 'Estrella' }), sortOrder: 1 },
    { name: 'Corazón de Fuego', description: 'Una insignia llameante para los más apasionados', type: 'BADGE', price: 1200, data: JSON.stringify({ icon: '🔥', color: '#ff4500', label: 'Ardiente' }), sortOrder: 2 },
    { name: 'Rosa Sakura', description: 'Una insignia floral delicada y elegante', type: 'BADGE', price: 2000, data: JSON.stringify({ icon: '🌸', color: '#ff69b4', label: 'Sakura' }), sortOrder: 3 },
    { name: 'Zorro Kitsune', description: 'El espíritu del zorro mítico', type: 'BADGE', price: 3500, data: JSON.stringify({ icon: '🦊', color: '#ff6b35', label: 'Kitsune' }), sortOrder: 4 },
    { name: 'Luna Plateada', description: 'Brilla con la luz de la luna en tu perfil', type: 'BADGE', price: 5000, data: JSON.stringify({ icon: '🌙', color: '#c0c0c0', label: 'Lunar' }), sortOrder: 5 },
    { name: 'Dragón Legendario', description: 'La insignia más rara. Solo los más dedicados la tienen.', type: 'BADGE', price: 15000, data: JSON.stringify({ icon: '🐉', color: '#8b0000', label: 'Legendario' }), sortOrder: 6 },

    // ── Títulos ──
    { name: 'Nuevo en la Escena', description: 'Título de bienvenida gratuito para los recién llegados a Gremio Estelar', type: 'TITLE', price: 0, data: JSON.stringify({ text: '✨ Nuevo en la Escena', color: '#00d4ff', gradient: 'linear-gradient(90deg, #00d4ff, #a78bfa)' }), sortOrder: 10 },
    { name: 'Fan Oficial', description: 'Eres un fan dedicado de la comunidad VTuber', type: 'TITLE', price: 800, data: JSON.stringify({ text: '💜 Fan Oficial', color: '#a78bfa', gradient: 'linear-gradient(90deg, #a78bfa, #ec4899)' }), sortOrder: 11 },
    { name: 'Cazador de Estrellas', description: 'Siempre al acecho de contenido nuevo', type: 'TITLE', price: 2500, data: JSON.stringify({ text: '⭐ Cazador de Estrellas', color: '#ffd700', gradient: 'linear-gradient(90deg, #ffd700, #ff6b35)' }), sortOrder: 12 },
    { name: 'VTuber Aprendiz', description: 'El inicio de un gran viaje', type: 'TITLE', price: 4500, data: JSON.stringify({ text: '🌟 VTuber Aprendiz', color: '#8b5cf6', gradient: 'linear-gradient(90deg, #8b5cf6, #ec4899)' }), sortOrder: 13 },
    { name: 'Leyenda del Gremio', description: 'Tu nombre es conocido por todos. El título más prestigioso.', type: 'TITLE', price: 10000, data: JSON.stringify({ text: '👑 Leyenda del Gremio', color: '#ffd700', gradient: 'linear-gradient(90deg, #ffd700, #ff6b35, #ff0080)' }), sortOrder: 14 },

    // ── Marcos de avatar (FRAME) ──
    { name: 'Marco Dorado', description: 'Un elegante marco dorado con destellos', type: 'FRAME', price: 1500, data: JSON.stringify({ borderColor: '#ffd700', borderStyle: 'solid', glow: 'rgba(255,215,0,0.5)', label: 'Dorado' }), sortOrder: 20 },
    { name: 'Marco Rosa Sakura', description: 'Delicado y floral, perfecto para fans del anime', type: 'FRAME', price: 2000, data: JSON.stringify({ borderColor: '#ff69b4', borderStyle: 'solid', glow: 'rgba(255,105,180,0.5)', label: 'Sakura' }), sortOrder: 21 },
    { name: 'Marco Neón Morado', description: 'Un marco de luz neón ultravioleta', type: 'FRAME', price: 3500, data: JSON.stringify({ borderColor: '#a78bfa', borderStyle: 'solid', glow: 'rgba(167,139,250,0.6)', label: 'Neón' }), sortOrder: 22 },
    { name: 'Marco de Fuego', description: 'Llamas ardientes rodean tu avatar', type: 'FRAME', price: 6000, data: JSON.stringify({ borderColor: '#ff4500', borderStyle: 'solid', glow: 'rgba(255,69,0,0.6)', gradient: 'conic-gradient(from 0deg, #ff4500, #ff8c00, #ffd700, #ff4500)', label: 'Fuego' }), sortOrder: 23 },
    { name: 'Marco Galaxia', description: 'El cosmos envuelve tu avatar. Ítem místico exclusivo.', type: 'FRAME', price: 12000, data: JSON.stringify({ borderColor: '#00d4ff', borderStyle: 'solid', glow: 'rgba(0,212,255,0.5)', gradient: 'conic-gradient(from 0deg, #8b5cf6, #00d4ff, #ec4899, #8b5cf6)', label: 'Galaxia' }), sortOrder: 24 },

    // ── Colores de acento ──
    { name: 'Amanecer', description: 'Un degradado naranja-dorado para tu perfil', type: 'COLOR', price: 600, data: JSON.stringify({ color: '#ff6b35' }), sortOrder: 30 },
    { name: 'Oscuridad Eterna', description: 'Un color púrpura oscuro misterioso', type: 'COLOR', price: 600, data: JSON.stringify({ color: '#2d1b69' }), sortOrder: 31 },
    { name: 'Fuego Helado', description: 'Un tono azul eléctrico intenso', type: 'COLOR', price: 800, data: JSON.stringify({ color: '#00d4ff' }), sortOrder: 32 },
    { name: 'Rosa Neón', description: 'Un vibrante rosa neón para destacar', type: 'COLOR', price: 800, data: JSON.stringify({ color: '#ff006e' }), sortOrder: 33 },
    { name: 'Oro Puro', description: 'Un elegante color dorado', type: 'COLOR', price: 1500, data: JSON.stringify({ color: '#ffd700' }), sortOrder: 34 },
    { name: 'Verde Neon', description: 'Intenso verde fosforescente', type: 'COLOR', price: 1000, data: JSON.stringify({ color: '#00ff88' }), sortOrder: 35 },
  ];

  for (const item of defaults) {
    const existing = await ShopRepository.findItemByName(item.name);
    if (!existing) {
      await ShopRepository.createItem(item);
    } else {
      await prisma.shopItem.update({
        where: { id: existing.id },
        data: { price: item.price, description: item.description, sortOrder: item.sortOrder },
      });
    }
  }

  // Deactivate removed banner items
  await prisma.shopItem.updateMany({
    where: { name: { in: ['Atardecer Pixelado', 'Galaxia Estelar', 'Aurora Boreal', 'Ciudad Cyberpunk'] } },
    data: { active: false },
  }).catch(() => {});

  shopItemsCache = null;
  return defaults.length;
};
