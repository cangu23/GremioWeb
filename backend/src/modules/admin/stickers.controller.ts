import { Request, Response, NextFunction } from 'express';
import prisma from '../../database/prisma';

// ========== LIST ALL STICKERS ==========

export const listStickers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, category, page = '1', limit = '50' } = req.query;
    const skip = (Math.max(1, Number(page)) - 1) * Math.min(100, Math.max(1, Number(limit)));

    const where: Record<string, unknown> = {};
    if (type) where.type = String(type);
    if (category) where.category = String(category);

    const [data, total] = await Promise.all([
      prisma.sticker.findMany({
        where,
        skip,
        take: Math.min(100, Math.max(1, Number(limit))),
        orderBy: { createdAt: 'desc' },
        include: {
          addedBy: { select: { id: true, username: true } },
        },
      }),
      prisma.sticker.count({ where }),
    ]);

    res.json({ data, total, page: Math.max(1, Number(page)) });
  } catch (err) { next(err); }
};

// ========== CREATE STICKER ==========

export const createSticker = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, imageUrl, category = 'general', type = 'sticker' } = req.body;
    const addedById = req.user!.id;

    if (!name || !imageUrl) {
      res.status(400).json({ status: 'error', message: 'name e imageUrl son requeridos' });
      return;
    }

    // Validate type
    if (!['emoji', 'sticker'].includes(type)) {
      res.status(400).json({ status: 'error', message: 'type debe ser "emoji" o "sticker"' });
      return;
    }

    const sticker = await prisma.sticker.create({
      data: { name, imageUrl, category, type, addedById },
    });

    res.status(201).json(sticker);
  } catch (err: any) {
    if (err?.code === 'P2002') {
      res.status(409).json({ status: 'error', message: `Ya existe un sticker con el nombre "${req.body.name}"` });
      return;
    }
    next(err);
  }
};

// ========== UPDATE STICKER ==========

export const updateSticker = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { name, imageUrl, category, type } = req.body;

    const existing = await prisma.sticker.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ status: 'error', message: 'Sticker no encontrado' });
      return;
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    if (category !== undefined) data.category = category;
    if (type !== undefined) {
      if (!['emoji', 'sticker'].includes(type)) {
        res.status(400).json({ status: 'error', message: 'type debe ser "emoji" o "sticker"' });
        return;
      }
      data.type = type;
    }

    const updated = await prisma.sticker.update({ where: { id }, data });
    res.json(updated);
  } catch (err: any) {
    if (err?.code === 'P2002') {
      res.status(409).json({ status: 'error', message: `Ya existe un sticker con ese nombre` });
      return;
    }
    next(err);
  }
};

// ========== DELETE STICKER ==========

export const deleteSticker = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.sticker.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ status: 'error', message: 'Sticker no encontrado' });
      return;
    }

    await prisma.sticker.delete({ where: { id } });
    res.json({ message: 'Sticker eliminado', id });
  } catch (err) { next(err); }
};

// ========== PUBLIC ENDPOINT: GET ACTIVE STICKERS ==========

export const getActiveStickers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, category } = req.query;
    const where: Record<string, unknown> = {};
    if (type) where.type = String(type);
    if (category) where.category = String(category);

    let stickers = await prisma.sticker.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    if (stickers.length === 0 && !type && !category) {
      const anyUser = await prisma.user.findFirst();
      if (anyUser) {
        await prisma.sticker.createMany({
          data: [
            { name: 'hola', imageUrl: 'https://api.iconify.design/fluent-emoji:waving-hand.svg', category: 'general', type: 'emoji', addedById: anyUser.id },
            { name: 'corazon', imageUrl: 'https://api.iconify.design/fluent-emoji:sparkling-heart.svg', category: 'hearts', type: 'emoji', addedById: anyUser.id },
            { name: 'fuego', imageUrl: 'https://api.iconify.design/fluent-emoji:fire.svg', category: 'reaction', type: 'emoji', addedById: anyUser.id },
            { name: 'fiesta', imageUrl: 'https://api.iconify.design/fluent-emoji:party-popper.svg', category: 'celebration', type: 'emoji', addedById: anyUser.id },
            { name: 'estrella', imageUrl: 'https://api.iconify.design/fluent-emoji:glowing-star.svg', category: 'general', type: 'emoji', addedById: anyUser.id },
            { name: 'risas', imageUrl: 'https://api.iconify.design/fluent-emoji:rolling-on-the-floor-laughing.svg', category: 'meme', type: 'emoji', addedById: anyUser.id },
            { name: 'gremio_sparkle', imageUrl: 'https://api.iconify.design/fluent-emoji:sparkles.svg', category: 'general', type: 'sticker', addedById: anyUser.id },
            { name: 'maid_heart', imageUrl: 'https://api.iconify.design/fluent-emoji:heart-with-ribbon.svg', category: 'hearts', type: 'sticker', addedById: anyUser.id },
          ],
          skipDuplicates: true,
        });
        stickers = await prisma.sticker.findMany({
          where,
          orderBy: [{ category: 'asc' }, { name: 'asc' }],
        });
      }
    }

    res.json(stickers);
  } catch (err) { next(err); }
};
