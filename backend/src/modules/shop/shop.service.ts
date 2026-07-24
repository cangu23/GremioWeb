import AppError from '../../errors/AppError';
import * as ShopRepository from './shop.repository';
import { spendStardust } from '../ecosystem/stardust.service';
import prisma from '../../database/prisma';

// ─── List shop items ───

export const listItems = async () => {
  return ShopRepository.findActiveItems();
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

  // Check user stardust balance
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stardust: true },
  });
  if (!user) throw new AppError('Usuario no encontrado', 404);

  if (user.stardust < item.price) {
    throw new AppError(
      `No tienes suficiente Stardust. Necesitas ⭐ ${item.price}, tienes ⭐ ${user.stardust}.`,
      400
    );
  }

  // Check if already purchased
  const type = item.type;
  const isConsumable = type === 'NAME_CHANGE' || type === 'PIN_POST';
  const existing = await ShopRepository.findUserPurchase(userId, itemId);

  if (!isConsumable && existing) {
    throw new AppError('Ya tienes este ítem', 400);
  }

  // Deduct stardust
  const result = await spendStardust(userId, item.price, `Compra en tienda: ${item.name}`);

  let purchase;
  if (isConsumable && existing) {
    const usesToAdd = type === 'NAME_CHANGE' ? 1 : 3;
    const newRemaining = (existing.remaining || 0) + usesToAdd;
    purchase = await ShopRepository.updatePurchaseRemaining(existing.id, newRemaining);
  } else if (isConsumable) {
    const initialUses = type === 'NAME_CHANGE' ? 1 : 3;
    purchase = await ShopRepository.createPurchase(userId, itemId, initialUses);
  } else {
    purchase = await ShopRepository.createPurchase(userId, itemId);
  }

  return {
    purchase,
    balance: result.newBalance,
  };
};

// ─── Equip/unequip an item ───

export const equipItem = async (userId: string, itemId: string) => {
  const purchase = await ShopRepository.findUserPurchase(userId, itemId);
  if (!purchase) throw new AppError('No tienes este ítem', 404);

  const type = purchase.item.type;
  const isConsumable = type === 'NAME_CHANGE' || type === 'PIN_POST';
  if (isConsumable) {
    throw new AppError('Este ítem no se puede equipar. Úsalo desde tu inventario.', 400);
  }

  const isEquipping = !purchase.equipped;

  // If equipping, unequip all other items of the same type first
  if (isEquipping) {
    await ShopRepository.unequipAllByType(userId, type);
  }

  await ShopRepository.setItemEquipped(userId, itemId, isEquipping);

  return { equipped: isEquipping, type };
};

// ─── Use a consumable ───

export const useConsumable = async (userId: string, itemId: string) => {
  const purchase = await ShopRepository.findUserPurchase(userId, itemId);
  if (!purchase) throw new AppError('No tienes este ítem', 404);

  const type = purchase.item.type;
  if (type !== 'NAME_CHANGE' && type !== 'PIN_POST') {
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

// ─── Get equipped badge ───

export const getEquippedBadge = async (userId: string) => {
  return ShopRepository.findEquippedByType(userId, 'BADGE');
};

// ─── Seed default shop items ───

export const seedDefaultItems = async () => {
  const defaults = [
    // ── Badges ──
    { name: 'Estrella Dorada', description: 'Una insignia dorada que brilla en tu perfil', type: 'BADGE', price: 100, data: JSON.stringify({ icon: '⭐', color: '#ffd700', label: 'Estrella' }), sortOrder: 1 },
    { name: 'Corazón de Fuego', description: 'Una insignia llameante para los más apasionados', type: 'BADGE', price: 200, data: JSON.stringify({ icon: '🔥', color: '#ff4500', label: 'Ardiente' }), sortOrder: 2 },
    { name: 'Luna Plateada', description: 'Brilla con la luz de la luna en tu perfil', type: 'BADGE', price: 350, data: JSON.stringify({ icon: '🌙', color: '#c0c0c0', label: 'Lunar' }), sortOrder: 3 },
    { name: 'Dragón Legendario', description: 'La insignia más rara. Solo los más dedicados la tienen.', type: 'BADGE', price: 1000, data: JSON.stringify({ icon: '🐉', color: '#8b0000', label: 'Legendario' }), sortOrder: 4 },
    { name: 'Rosa Sakura', description: 'Una insignia floral delicada y elegante', type: 'BADGE', price: 250, data: JSON.stringify({ icon: '🌸', color: '#ff69b4', label: 'Sakura' }), sortOrder: 5 },
    { name: 'Zorro Kitsune', description: 'El espíritu del zorro mítico', type: 'BADGE', price: 500, data: JSON.stringify({ icon: '🦊', color: '#ff6b35', label: 'Kitsune' }), sortOrder: 6 },

    // ── Títulos ──
    { name: 'Nuevo en la Escena', description: 'Para los que acaban de llegar a Gremio Estelar', type: 'TITLE', price: 80, data: JSON.stringify({ text: '✨ Nuevo en la Escena', color: '#00d4ff', gradient: 'linear-gradient(90deg, #00d4ff, #a78bfa)' }), sortOrder: 10 },
    { name: 'Fan Oficial', description: 'Eres un fan dedicado de la comunidad VTuber', type: 'TITLE', price: 150, data: JSON.stringify({ text: '💜 Fan Oficial', color: '#a78bfa', gradient: 'linear-gradient(90deg, #a78bfa, #ec4899)' }), sortOrder: 11 },
    { name: 'Cazador de Estrellas', description: 'Siempre al acecho de contenido nuevo', type: 'TITLE', price: 300, data: JSON.stringify({ text: '⭐ Cazador de Estrellas', color: '#ffd700', gradient: 'linear-gradient(90deg, #ffd700, #ff6b35)' }), sortOrder: 12 },
    { name: 'Leyenda del Gremio', description: 'Tu nombre es conocido por todos', type: 'TITLE', price: 800, data: JSON.stringify({ text: '👑 Leyenda del Gremio', color: '#ffd700', gradient: 'linear-gradient(90deg, #ffd700, #ff6b35, #ff0080)' }), sortOrder: 13 },
    { name: 'VTuber Aprendiz', description: 'El inicio de un gran viaje', type: 'TITLE', price: 400, data: JSON.stringify({ text: '🌟 VTuber Aprendiz', color: '#8b5cf6', gradient: 'linear-gradient(90deg, #8b5cf6, #ec4899)' }), sortOrder: 14 },

    // ── Marcos de avatar (FRAME) ──
    { name: 'Marco Dorado', description: 'Un elegante marco dorado con destellos', type: 'FRAME', price: 300, data: JSON.stringify({ borderColor: '#ffd700', borderStyle: 'solid', glow: 'rgba(255,215,0,0.5)', label: 'Dorado' }), sortOrder: 20 },
    { name: 'Marco Neón Morado', description: 'Un marco de luz neón ultravioleta', type: 'FRAME', price: 400, data: JSON.stringify({ borderColor: '#a78bfa', borderStyle: 'solid', glow: 'rgba(167,139,250,0.6)', label: 'Neón' }), sortOrder: 21 },
    { name: 'Marco de Fuego', description: 'Llamas ardientes rodean tu avatar', type: 'FRAME', price: 600, data: JSON.stringify({ borderColor: '#ff4500', borderStyle: 'solid', glow: 'rgba(255,69,0,0.6)', gradient: 'conic-gradient(from 0deg, #ff4500, #ff8c00, #ffd700, #ff4500)', label: 'Fuego' }), sortOrder: 22 },
    { name: 'Marco Galaxia', description: 'El cosmos envuelve tu avatar', type: 'FRAME', price: 800, data: JSON.stringify({ borderColor: '#00d4ff', borderStyle: 'solid', glow: 'rgba(0,212,255,0.5)', gradient: 'conic-gradient(from 0deg, #8b5cf6, #00d4ff, #ec4899, #8b5cf6)', label: 'Galaxia' }), sortOrder: 23 },
    { name: 'Marco Rosa Sakura', description: 'Delicado y floral, perfecto para fans del anime', type: 'FRAME', price: 350, data: JSON.stringify({ borderColor: '#ff69b4', borderStyle: 'solid', glow: 'rgba(255,105,180,0.5)', label: 'Sakura' }), sortOrder: 24 },

    // ── Colores de acento ──
    { name: 'Amanecer', description: 'Un degradado naranja-dorado para tu perfil', type: 'COLOR', price: 150, data: JSON.stringify({ color: '#ff6b35' }), sortOrder: 30 },
    { name: 'Oscuridad Eterna', description: 'Un color púrpura oscuro misterioso', type: 'COLOR', price: 150, data: JSON.stringify({ color: '#2d1b69' }), sortOrder: 31 },
    { name: 'Fuego Helado', description: 'Un tono azul eléctrico intenso', type: 'COLOR', price: 150, data: JSON.stringify({ color: '#00d4ff' }), sortOrder: 32 },
    { name: 'Rosa Neón', description: 'Un vibrante rosa neón para destacar', type: 'COLOR', price: 150, data: JSON.stringify({ color: '#ff006e' }), sortOrder: 33 },
    { name: 'Oro Puro', description: 'Un elegante color dorado', type: 'COLOR', price: 250, data: JSON.stringify({ color: '#ffd700' }), sortOrder: 34 },
    { name: 'Verde Neon', description: 'Intenso verde fosforescente', type: 'COLOR', price: 200, data: JSON.stringify({ color: '#00ff88' }), sortOrder: 35 },

    // ── Banners ──
    { name: 'Atardecer Pixelado', description: 'Un banner estilo pixel art de un atardecer', type: 'BANNER', price: 400, data: JSON.stringify({ bannerUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' }), sortOrder: 40 },
    { name: 'Galaxia Estelar', description: 'Un banner con una galaxia llena de estrellas', type: 'BANNER', price: 400, data: JSON.stringify({ bannerUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80' }), sortOrder: 41 },
    { name: 'Aurora Boreal', description: 'Las luces del norte iluminan tu perfil', type: 'BANNER', price: 500, data: JSON.stringify({ bannerUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80' }), sortOrder: 42 },
    { name: 'Ciudad Cyberpunk', description: 'Neon lights en la ciudad del futuro', type: 'BANNER', price: 500, data: JSON.stringify({ bannerUrl: 'https://images.unsplash.com/photo-1519608825926-d7b8c4c91dea?w=800&q=80' }), sortOrder: 43 },

    // ── Efectos de hover ──
    { name: 'Brillo Mágico', description: 'Un brillo suave alrededor de tu avatar', type: 'HOVER', price: 200, data: JSON.stringify({ effect: 'glow' }), sortOrder: 50 },
    { name: 'Aura de Fuego', description: 'Llamas sutiles alrededor de tu avatar', type: 'HOVER', price: 400, data: JSON.stringify({ effect: 'fire' }), sortOrder: 51 },
    { name: 'Destellos Estelares', description: 'Destellos de estrellas al pasar el mouse', type: 'HOVER', price: 600, data: JSON.stringify({ effect: 'sparkle' }), sortOrder: 52 },

    // ── Consumibles ──
    { name: 'Cambio de Nombre', description: 'Permite cambiar tu nombre de usuario una vez', type: 'NAME_CHANGE', price: 500, data: JSON.stringify({}), sortOrder: 60 },
    { name: 'Post Destacado', description: 'Fija un post en tu perfil por 24 horas (3 usos)', type: 'PIN_POST', price: 200, data: JSON.stringify({ uses: 3 }), sortOrder: 61 },
  ];

  for (const item of defaults) {
    const existing = await ShopRepository.findItemByName(item.name);
    if (!existing) {
      await ShopRepository.createItem(item);
    }
  }

  return defaults.length;
};
