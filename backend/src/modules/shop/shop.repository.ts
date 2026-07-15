import prisma from '../../database/prisma';

// ─── Shop Items ───

export const findActiveItems = () =>
  prisma.shopItem.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  });

export const findItemById = (id: string) =>
  prisma.shopItem.findUnique({ where: { id } });

export const findItemByName = (name: string) =>
  prisma.shopItem.findFirst({ where: { name } });

export const createItem = (data: {
  name: string;
  description: string;
  type: string;
  price: number;
  imageUrl?: string;
  data?: string;
  sortOrder?: number;
}) =>
  prisma.shopItem.create({ data });

// ─── Purchases ───

export const findUserPurchases = (userId: string) =>
  prisma.userPurchase.findMany({
    where: { userId },
    include: { item: true },
    orderBy: { createdAt: 'desc' },
  });

export const findUserPurchase = (userId: string, itemId: string) =>
  prisma.userPurchase.findUnique({
    where: { userId_itemId: { userId, itemId } },
    include: { item: true },
  });

export const createPurchase = (userId: string, itemId: string, remaining?: number) =>
  prisma.userPurchase.create({
    data: { userId, itemId, remaining },
    include: { item: true },
  });

export const updatePurchaseRemaining = (id: string, remaining: number) =>
  prisma.userPurchase.update({
    where: { id },
    data: { remaining },
  });

export const deletePurchase = (id: string) =>
  prisma.userPurchase.delete({ where: { id } });

// ─── Equipping ───

export const setItemEquipped = (userId: string, itemId: string, equipped: boolean) =>
  prisma.userPurchase.update({
    where: { userId_itemId: { userId, itemId } },
    data: { equipped },
  });

export const unequipAllByType = (userId: string, type: string) =>
  prisma.userPurchase.updateMany({
    where: {
      userId,
      equipped: true,
      item: { type },
    },
    data: { equipped: false },
  });

export const findEquippedByType = (userId: string, type: string) =>
  prisma.userPurchase.findFirst({
    where: { userId, equipped: true, item: { type } },
    include: { item: true },
  });
