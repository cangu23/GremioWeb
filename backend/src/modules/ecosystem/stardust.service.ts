import prisma from '../../database/prisma';
import AppError from '../../errors/AppError';

// Multipliers by plan/role
export const PLAN_STARDUST_MULTIPLIERS: Record<string, number> = {
  FREE: 1.0,
  ASTRO: 1.2,
  NOVA: 1.5,
  STELLAR: 2.0,
};

export const getStardustMultiplier = (userPlan: string, userRole: string): number => {
  if (userRole === 'VTUBER' || userRole === 'MAID' || userRole === 'ADMIN') {
    return 2.0; // Automatically equivalent to STELLAR
  }
  return PLAN_STARDUST_MULTIPLIERS[userPlan] || 1.0;
};

export const addStardust = async (userId: string, baseAmount: number, reason: string) => {
  if (baseAmount <= 0) return 0;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, role: true, stardust: true },
  });

  if (!user) throw new AppError('Usuario no encontrado', 404);

  const multiplier = getStardustMultiplier(user.plan || 'FREE', user.role || 'USER');
  const finalAmount = Math.round(baseAmount * multiplier);

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { stardust: { increment: finalAmount } },
    }),
    prisma.stardustTransaction.create({
      data: {
        userId,
        amount: finalAmount,
        reason,
      },
    }),
  ]);

  return {
    stardustEarned: finalAmount,
    newBalance: updatedUser.stardust,
    multiplier,
  };
};

export const spendStardust = async (userId: string, amount: number, reason: string) => {
  if (amount <= 0) throw new AppError('El monto debe ser positivo', 400);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stardust: true },
  });

  if (!user) throw new AppError('Usuario no encontrado', 404);
  if (user.stardust < amount) {
    throw new AppError(`No tienes suficiente Stardust. Tienes ⭐ ${user.stardust} pero necesitas ⭐ ${amount}.`, 400);
  }

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { stardust: { decrement: amount } },
    }),
    prisma.stardustTransaction.create({
      data: {
        userId,
        amount: -amount,
        reason,
      },
    }),
  ]);

  return {
    stardustSpent: amount,
    newBalance: updatedUser.stardust,
  };
};

export const getStardustBalance = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stardust: true, plan: true, role: true },
  });

  if (!user) throw new AppError('Usuario no encontrado', 404);

  return {
    stardust: user.stardust,
    plan: user.plan,
    multiplier: getStardustMultiplier(user.plan || 'FREE', user.role || 'USER'),
  };
};

export const getStardustHistory = async (userId: string, limit = 20) => {
  return prisma.stardustTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};
