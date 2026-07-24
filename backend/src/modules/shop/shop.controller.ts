import { Request, Response, NextFunction } from 'express';
import * as ShopService from './shop.service';

export const listItems = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await ShopService.listItems();
    res.json(items);
  } catch (err) {
    next(err);
  }
};

export const getInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inventory = await ShopService.getInventory(req.user!.id);
    res.json(inventory);
  } catch (err) {
    next(err);
  }
};

export const buyItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const itemId = req.params.itemId as string;
    const result = await ShopService.buyItem(req.user!.id, itemId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const equipItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const itemId = req.params.itemId as string;
    const result = await ShopService.equipItem(req.user!.id, itemId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const useConsumable = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const itemId = req.params.itemId as string;
    const result = await ShopService.useConsumable(req.user!.id, itemId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getEquippedBadge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const badge = await ShopService.getEquippedBadge(req.user!.id);
    res.json(badge);
  } catch (err) {
    next(err);
  }
};

// Get equipped badge for a specific user (public)
export const getUserEquippedBadge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId as string;
    const badge = await ShopService.getEquippedBadge(userId);
    res.json(badge);
  } catch (err) {
    next(err);
  }
};

// Get all equipped items for a specific user (public)
export const getPublicEquipped = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId as string;
    const items = await ShopService.getPublicEquipped(userId);
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// ─── Seed default shop items (admin) ───
export const seedItems = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await ShopService.seedDefaultItems();
    res.json({ message: 'Ítems de tienda creados correctamente' });
  } catch (err) {
    next(err);
  }
};
