import { Request, Response, NextFunction } from 'express';
import prisma from '../../database/prisma';

export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = String(req.query.room || 'global');
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    const messages = await prisma.chatMessage.findMany({
      where: { room },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            avatarUrl: true,
            vtuberProfile: { select: { displayName: true, avatarUrl: true, isVerified: true } },
            purchases: {
              where: { equipped: true },
              include: { item: true },
            },
          },
        },
      },
    });

    res.json(messages.reverse());
  } catch (err) {
    next(err);
  }
};
