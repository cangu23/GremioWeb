import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database';
import { ioContext } from '../../websocket/socket.server';

export const feedPet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const feederId = (req as any).user?.id;
    if (!feederId) {
      res.status(401).json({ status: 'error', message: 'No autenticado.' });
      return;
    }

    const { targetUserId } = req.body;
    const petOwnerId = targetUserId || feederId;

    const [feeder, petOwner] = await Promise.all([
      prisma.user.findUnique({ where: { id: feederId } }),
      prisma.user.findUnique({ where: { id: petOwnerId } }),
    ]);

    if (!feeder) {
      res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
      return;
    }

    if (!petOwner || !petOwner.profilePet) {
      res.status(400).json({ status: 'error', message: 'Este usuario no tiene una mascota equipada.' });
      return;
    }

    // Check payment: 25 Stardust per feeding
    const FEED_COST = 25;
    if (feeder.stardust < FEED_COST) {
      res.status(400).json({
        status: 'error',
        message: `Necesitas al menos ${FEED_COST} Stardust ⭐ para alimentar a la mascota.`,
      });
      return;
    }

    // Deduct stardust cost from feeder
    await prisma.user.update({
      where: { id: feederId },
      data: { stardust: { decrement: FEED_COST } },
    });

    // Calculate pet updates
    const currentHunger = petOwner.petHunger ?? 80;
    const currentExp = petOwner.petExp ?? 0;
    const currentLevel = petOwner.petLevel ?? 1;

    const newHunger = Math.min(100, currentHunger + 25);
    const newExp = currentExp + 20;
    const newLevel = Math.floor(newExp / 100) + 1;
    const leveledUp = newLevel > currentLevel;

    const updatedOwner = await prisma.user.update({
      where: { id: petOwnerId },
      data: {
        petHunger: newHunger,
        petExp: newExp,
        petLevel: newLevel,
        lastFedAt: new Date(),
      },
    });

    // Notify pet owner if fed by another user
    if (feederId !== petOwnerId) {
      await prisma.notification.create({
        data: {
          userId: petOwnerId,
          type: 'pet_fed',
          title: '🍖 ¡Tu mascota fue alimentada!',
          message: `@${feeder.username} alimentó a tu mascota "${petOwner.petName || 'Mascota'}" (+20 XP ✨)`,
          referenceId: feederId,
        },
      }).catch(() => {});
    }

    // Real-time Socket.IO emission
    ioContext.instance?.to(`user:${petOwnerId}`).emit('pet:updated', {
      petName: updatedOwner.petName,
      petLevel: updatedOwner.petLevel,
      petExp: updatedOwner.petExp,
      petHunger: updatedOwner.petHunger,
      lastFedAt: updatedOwner.lastFedAt,
      leveledUp,
      fedBy: feeder.username,
    });

    res.json({
      status: 'ok',
      message: leveledUp
        ? `¡Felicidades! La mascota "${updatedOwner.petName || 'Mascota'}" subió al Nivel ${newLevel}! 🎉✨`
        : `¡Mascota alimentada con éxito! (+20 XP 🍖)`,
      pet: {
        petName: updatedOwner.petName,
        petImage1: updatedOwner.profilePet,
        petImage2: updatedOwner.petImage2,
        petLevel: updatedOwner.petLevel,
        petExp: updatedOwner.petExp,
        petHunger: updatedOwner.petHunger,
        lastFedAt: updatedOwner.lastFedAt,
      },
      leveledUp,
    });
  } catch (err) {
    next(err);
  }
};
