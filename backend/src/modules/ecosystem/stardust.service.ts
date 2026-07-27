import prisma from '../../database/prisma';
import AppError from '../../errors/AppError';
import { activatePlatformPlan } from '../subscriptions/platform-subscriptions.service';
import { createNotification } from '../notifications/notifications.repository';

// Multipliers by plan/role
export const PLAN_STARDUST_MULTIPLIERS: Record<string, number> = {
  FREE: 1.0,
  ASTRO: 1.2,
  NOVA: 1.5,
  STELLAR: 2.0,
};

export const GIFT_PLAN_STARDUST_COSTS: Record<string, number> = {
  ASTRO: 15000,
  NOVA: 35000,
  STELLAR: 80000,
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
    role: user.role,
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

export const transferStardust = async (
  senderId: string,
  targetUser: string,
  amount: number,
  message?: string
) => {
  if (!targetUser || !targetUser.trim()) {
    throw new AppError('Debes ingresar el nombre de usuario o correo del destinatario', 400);
  }
  if (!amount || amount <= 0) {
    throw new AppError('La cantidad de Polvo Estelar a enviar debe ser mayor a 0', 400);
  }

  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { id: true, username: true, stardust: true },
  });
  if (!sender) throw new AppError('Usuario remitente no encontrado', 404);

  const cleanTarget = targetUser.trim().replace(/^@/, '');
  const recipient = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: cleanTarget, mode: 'insensitive' } },
        { email: { equals: cleanTarget, mode: 'insensitive' } },
      ],
    },
    select: { id: true, username: true, email: true },
  });

  if (!recipient) {
    throw new AppError(`No se encontró ningún usuario con el nombre o correo "${targetUser}"`, 404);
  }

  if (recipient.id === sender.id) {
    throw new AppError('No puedes transferirte Polvo Estelar a ti mismo', 400);
  }

  const transferReasonSender = `Transferencia enviada a @${recipient.username}${message ? `: "${message}"` : ''}`;
  const spendResult = await spendStardust(sender.id, amount, transferReasonSender);

  const transferReasonRecipient = `Regalo recibido de @${sender.username}${message ? `: "${message}"` : ''}`;
  await addStardust(recipient.id, amount, transferReasonRecipient);

  // Send real-time notification to recipient
  await createNotification({
    userId: recipient.id,
    type: 'STARDUST_RECEIVED',
    title: '⭐ ¡Has recibido Polvo Estelar!',
    message: `@${sender.username} te ha regalado ⭐ ${amount.toLocaleString()} Polvo Estelar${message ? `: "${message}"` : ''}`,
    referenceId: sender.id,
  }).catch(() => {});

  return {
    success: true,
    message: `¡Has transferido ⭐ ${amount.toLocaleString()} Polvo Estelar a @${recipient.username} con éxito!`,
    newBalance: spendResult.newBalance,
    recipient: recipient.username,
  };
};

export const giftPlatformPlanWithStardust = async (
  senderId: string,
  targetUser: string,
  plan: 'ASTRO' | 'NOVA' | 'STELLAR'
) => {
  if (!GIFT_PLAN_STARDUST_COSTS[plan]) {
    throw new AppError('Plan no válido para regalar', 400);
  }

  const cost = GIFT_PLAN_STARDUST_COSTS[plan];

  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { id: true, username: true, plan: true, role: true, stardust: true },
  });
  if (!sender) throw new AppError('Usuario remitente no encontrado', 404);

  const isEligible =
    sender.plan === 'ASTRO' ||
    sender.plan === 'NOVA' ||
    sender.plan === 'STELLAR' ||
    sender.role === 'VTUBER' ||
    sender.role === 'MAID' ||
    sender.role === 'ADMIN';

  if (!isEligible) {
    throw new AppError(
      'La función de regalar suscripciones Premium por Polvo Estelar es exclusiva para suscriptores con plan activo Astro ($2.99) o Nova Pro ($5.99) en adelante.',
      403
    );
  }

  const cleanTarget = targetUser.trim().replace(/^@/, '');
  const recipient = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: cleanTarget, mode: 'insensitive' } },
        { email: { equals: cleanTarget, mode: 'insensitive' } },
      ],
    },
    select: { id: true, username: true, email: true },
  });

  if (!recipient) {
    throw new AppError(`No se encontró ningún usuario con el nombre o correo "${targetUser}"`, 404);
  }

  if (recipient.id === sender.id) {
    throw new AppError('No puedes regalarte una suscripción a ti mismo con este método', 400);
  }

  const spendReason = `Regalo de Suscripción Plan ${plan} (10 días) a @${recipient.username}`;
  const spendResult = await spendStardust(sender.id, cost, spendReason);

  // Activate plan for recipient for 10 days
  const activation = await activatePlatformPlan(recipient.id, plan, 10);

  // Send real-time notification to recipient
  await createNotification({
    userId: recipient.id,
    type: 'GIFT_PLAN_RECEIVED',
    title: '🎁 ¡Te regalaron una Membresía Premium!',
    message: `@${sender.username} te regaló 10 días del Plan ${plan}!`,
    referenceId: sender.id,
  }).catch(() => {});

  return {
    success: true,
    message: `¡Felicidades! Le has regalado 10 días del Plan ${plan} a @${recipient.username} por ⭐ ${cost.toLocaleString()} Polvo Estelar.`,
    newBalance: spendResult.newBalance,
    recipient: recipient.username,
    plan,
    activation,
  };
};
