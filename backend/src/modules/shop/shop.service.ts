import AppError from '../../errors/AppError';
import * as ShopRepository from './shop.repository';
import * as GamificationRepository from '../gamification/gamification.repository';

// ─── List shop items ───

export const listItems = async () => {
  return ShopRepository.findActiveItems();
};

// ─── Get user inventory ───

export const getInventory = async (userId: string) => {
  return ShopRepository.findUserPurchases(userId);
};

// ─── Buy an item ───

export const buyItem = async (userId: string, itemId: string) => {
  const item = await ShopRepository.findItemById(itemId);
  if (!item) throw new AppError('Ítem no encontrado', 404);
  if (!item.active) throw new AppError('Este ítem ya no está disponible', 400);

  // Get user's XP (usable as currency)
  const profile = await GamificationRepository.getUserGamificationProfile(userId);
  if (!profile) throw new AppError('Usuario no encontrado', 404);

  // Check if user has enough points
  if (profile.xp < item.price) {
    throw new AppError(
      `No tienes suficientes puntos. Necesitas ${item.price} pts, tienes ${profile.xp} pts.`,
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

  // Deduct points
  await GamificationRepository.addXpToUser(userId, -item.price);

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
    balance: profile.xp - item.price,
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
    // Delete the purchase record when exhausted
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

// ─── Get equipped color ───

export const getEquippedColors = async (userId: string) => {
  const purchases = await ShopRepository.findUserPurchases(userId);
  return purchases
    .filter((p) => p.item.type === 'COLOR' && p.equipped)
    .map((p) => JSON.parse(p.item.data || '{}'));
};

// ─── Get purchased custom banner ───

export const getCustomBanner = async (userId: string) => {
  const banners = await ShopRepository.findEquippedByType(userId, 'BANNER');
  return banners ? JSON.parse(banners.item.data || '{}').bannerUrl : null;
};

// ─── Seed default shop items ───

export const seedDefaultItems = async () => {
  const defaults = [
    // Badges
    { name: 'Estrella Dorada', description: 'Una insignia dorada que brilla en tu perfil', type: 'BADGE', price: 100, data: JSON.stringify({ icon: '⭐', label: 'Estrella' }), sortOrder: 1 },
    { name: 'Corazón de Fuego', description: 'Una insignia llameante para los más apasionados', type: 'BADGE', price: 200, data: JSON.stringify({ icon: '🔥', label: 'Ardiente' }), sortOrder: 2 },
    { name: 'Luna Plateada', description: 'Brilla con la luz de la luna en tu perfil', type: 'BADGE', price: 350, data: JSON.stringify({ icon: '🌙', label: 'Lunar' }), sortOrder: 3 },
    { name: 'Dragón Legendario', description: 'La insignia más rara. Solo los más dedicados la tienen.', type: 'BADGE', price: 1000, data: JSON.stringify({ icon: '🐉', label: 'Legendario' }), sortOrder: 4 },
    
    // Theme colors (exclusivos de tienda)
    { name: 'Amanecer', description: 'Un degradado naranja-dorado para tu perfil', type: 'COLOR', price: 150, data: JSON.stringify({ color: '#ff6b35' }), sortOrder: 10 },
    { name: 'Oscuridad Eterna', description: 'Un color púrpura oscuro misterioso', type: 'COLOR', price: 150, data: JSON.stringify({ color: '#2d1b69' }), sortOrder: 11 },
    { name: 'Fuego Helado', description: 'Un tono azul eléctrico intenso', type: 'COLOR', price: 150, data: JSON.stringify({ color: '#00d4ff' }), sortOrder: 12 },
    { name: 'Rosa Neón', description: 'Un vibrante rosa neón para destacar', type: 'COLOR', price: 150, data: JSON.stringify({ color: '#ff006e' }), sortOrder: 13 },
    { name: 'Oro Puro', description: 'Un elegante color dorado', type: 'COLOR', price: 250, data: JSON.stringify({ color: '#ffd700' }), sortOrder: 14 },

    // Banners
    { name: 'Atardecer Pixelado', description: 'Un banner estilo pixel art de un atardecer', type: 'BANNER', price: 300, data: JSON.stringify({ bannerUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' }), sortOrder: 20 },
    { name: 'Galaxia Estelar', description: 'Un banner con una galaxia llena de estrellas', type: 'BANNER', price: 300, data: JSON.stringify({ bannerUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80' }), sortOrder: 21 },

    // Hover effects
    { name: 'Brillo Mágico', description: 'Un brillo suave alrededor de tu avatar', type: 'HOVER', price: 200, data: JSON.stringify({ effect: 'glow' }), sortOrder: 30 },
    { name: 'Aura de Fuego', description: 'Llamas sutiles alrededor de tu avatar', type: 'HOVER', price: 400, data: JSON.stringify({ effect: 'fire' }), sortOrder: 31 },
    { name: 'Destellos Estelares', description: 'Destellos de estrellas al pasar el mouse', type: 'HOVER', price: 600, data: JSON.stringify({ effect: 'sparkle' }), sortOrder: 32 },

    // Consumables
    { name: 'Cambio de Nombre', description: 'Permite cambiar tu nombre de usuario una vez', type: 'NAME_CHANGE', price: 500, data: JSON.stringify({}), sortOrder: 40 },
    { name: 'Post Destacado', description: 'Fija un post en tu perfil por 24 horas (3 usos)', type: 'PIN_POST', price: 200, data: JSON.stringify({ uses: 3 }), sortOrder: 41 },
  ];

  for (const item of defaults) {
    const existing = await ShopRepository.findItemByName(item.name);
    if (!existing) {
      await ShopRepository.createItem(item);
    }
  }

  return defaults.length;
};
