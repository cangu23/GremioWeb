import prisma from '../../database/prisma';
import AppError from '../../errors/AppError';
import { hasAnyRole } from '@gremio-estelar/shared';

export const CREATOR_COMMISSION_RATE = 0.35; // 35% de cada compra va a la creadora
export const MIN_PAYOUT_AMOUNT = 10.0; // Mínimo de $10 USD para solicitar retiro

/**
 * Normaliza un código de creador (mayúsculas, sin espacios, solo letras, números y guión bajo).
 */
export function normalizeCreatorCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
}

/**
 * Valida si un código de creador existe, está activo y no pertenece al propio comprador.
 */
export async function validateCreatorCode(rawCode: string, buyerId?: string) {
  const code = normalizeCreatorCode(rawCode);
  if (!code || code.length < 2) {
    return { valid: false, message: 'Código demasiado corto' };
  }

  const creatorCode = await prisma.creatorCode.findUnique({
    where: { code },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          vtuberProfile: { select: { displayName: true, avatarUrl: true } },
          streamerProfile: { select: { displayName: true, avatarUrl: true } },
        },
      },
    },
  });

  if (!creatorCode || creatorCode.status !== 'ACTIVE') {
    return { valid: false, message: 'Código de creador no válido o inactivo' };
  }

  if (buyerId && creatorCode.userId === buyerId) {
    return { valid: false, message: 'No puedes usar tu propio código de creador' };
  }

  const creatorUser = creatorCode.user;
  const name =
    creatorUser.vtuberProfile?.displayName ||
    creatorUser.streamerProfile?.displayName ||
    creatorUser.displayName ||
    creatorUser.username;

  const avatar =
    creatorUser.avatarUrl ||
    creatorUser.vtuberProfile?.avatarUrl ||
    creatorUser.streamerProfile?.avatarUrl;

  return {
    valid: true,
    code: creatorCode.code,
    bonusPercent: 10,
    message: `¡Apoyando a ${name}! Recibirás un +10% de Stardust extra de regalo.`,
    creator: {
      id: creatorUser.id,
      username: creatorUser.username,
      name,
      avatar,
      role: creatorUser.role,
    },
  };
}

/**
 * Obtiene o crea el código de creador de una usuaria con rango de creadora (VTUBER, STREAMER, MAID, STAFF, ADMIN).
 */
export async function getOrCreateCreatorCode(userId: string, desiredCode?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, role: true },
  });

  if (!user) throw new AppError('Usuario no encontrado', 404);

  const isEligible = hasAnyRole(user.role, [
    'VTUBER',
    'STREAMER',
    'MAID',
    'STAFF',
    'MODERATOR',
    'ADMIN',
    'OWNER',
  ]);

  if (!isEligible) {
    throw new AppError('Debes ser una VTuber, Streamer o Maid aprobada para tener código de creador', 403);
  }

  const existing = await prisma.creatorCode.findUnique({ where: { userId } });
  if (existing) {
    if (desiredCode && normalizeCreatorCode(desiredCode) !== existing.code) {
      const newCode = normalizeCreatorCode(desiredCode);
      if (newCode.length < 3 || newCode.length > 20) {
        throw new AppError('El código debe tener entre 3 y 20 caracteres', 400);
      }
      const taken = await prisma.creatorCode.findUnique({ where: { code: newCode } });
      if (taken && taken.id !== existing.id) {
        throw new AppError(`El código "${newCode}" ya está en uso por otra creadora`, 409);
      }
      return prisma.creatorCode.update({
        where: { id: existing.id },
        data: { code: newCode },
      });
    }
    return existing;
  }

  const defaultCode = desiredCode ? normalizeCreatorCode(desiredCode) : normalizeCreatorCode(user.username);
  if (defaultCode.length < 3 || defaultCode.length > 20) {
    throw new AppError('El código debe tener entre 3 y 20 caracteres', 400);
  }

  const taken = await prisma.creatorCode.findUnique({ where: { code: defaultCode } });
  if (taken) {
    throw new AppError(`El código "${defaultCode}" ya está en uso. Elige uno personalizado.`, 409);
  }

  return prisma.creatorCode.create({
    data: {
      userId,
      code: defaultCode,
      status: 'ACTIVE',
    },
  });
}

/**
 * Registra una compra apoyando a una creadora y acredita el 35% de comisión a su balance.
 */
export async function recordCreatorPurchase(params: {
  code: string;
  totalAmount: number;
  buyerId: string;
  orderId?: string;
  itemType: string;
}) {
  const { code: rawCode, totalAmount, buyerId, orderId, itemType } = params;
  const validation = await validateCreatorCode(rawCode, buyerId);
  if (!validation.valid || !validation.creator) return null;

  const creatorCode = await prisma.creatorCode.findUnique({
    where: { code: validation.code },
  });
  if (!creatorCode) return null;

  // 35% para la creadora
  const creatorCommission = Math.round(totalAmount * CREATOR_COMMISSION_RATE * 100) / 100;

  const [updatedCode, log] = await prisma.$transaction([
    prisma.creatorCode.update({
      where: { id: creatorCode.id },
      data: {
        balance: { increment: creatorCommission },
        totalEarnings: { increment: creatorCommission },
        usesCount: { increment: 1 },
      },
    }),
    prisma.creatorEarningsLog.create({
      data: {
        creatorCodeId: creatorCode.id,
        buyerId,
        orderId,
        itemType,
        totalAmount,
        creatorCommission,
      },
    }),
  ]);

  return {
    creatorCode: updatedCode,
    earningsLog: log,
    commission: creatorCommission,
  };
}

/**
 * Solicita retiro de saldo acumulado a una cuenta PayPal.
 */
export async function requestPayout(userId: string, amount: number, paypalEmail: string) {
  const creatorCode = await prisma.creatorCode.findUnique({ where: { userId } });
  if (!creatorCode) throw new AppError('No tienes un código de creador activo', 404);

  if (amount < MIN_PAYOUT_AMOUNT) {
    throw new AppError(`El monto mínimo de retiro es de $${MIN_PAYOUT_AMOUNT} USD`, 400);
  }

  if (amount > creatorCode.balance) {
    throw new AppError(`Saldo insuficiente. Tu saldo disponible es de $${creatorCode.balance.toFixed(2)} USD`, 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(paypalEmail)) {
    throw new AppError('Ingresa un correo de PayPal válido', 400);
  }

  return prisma.$transaction(async (tx) => {
    await tx.creatorCode.update({
      where: { id: creatorCode.id },
      data: { balance: { decrement: amount } },
    });

    const payout = await tx.creatorPayout.create({
      data: {
        creatorCodeId: creatorCode.id,
        userId,
        amount,
        paypalEmail: paypalEmail.trim().toLowerCase(),
        status: 'PENDING',
      },
    });

    return payout;
  });
}

/**
 * Obtiene el resumen de ganancias y retiros de la creadora para su dashboard.
 */
export async function getCreatorDashboard(userId: string) {
  const creatorCode = await prisma.creatorCode.findUnique({
    where: { userId },
    include: {
      earningsLogs: {
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
        },
      },
      payouts: {
        take: 20,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return creatorCode;
}

/**
 * Lista todos los retiros pendientes para el Administrador.
 */
export async function listPayoutsAdmin(status?: string) {
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  return prisma.creatorPayout.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          role: true,
        },
      },
      creatorCode: {
        select: { code: true, balance: true, totalEarnings: true },
      },
    },
  });
}

/**
 * Procesa un retiro desde el panel de Administrador (Marcar pagado o Rechazar devolviendo saldo).
 */
export async function processPayoutAdmin(
  payoutId: string,
  action: 'PAID' | 'REJECTED',
  adminNotes?: string
) {
  const payout = await prisma.creatorPayout.findUnique({
    where: { id: payoutId },
    include: { creatorCode: true },
  });

  if (!payout) throw new AppError('Solicitud de retiro no encontrada', 404);
  if (payout.status !== 'PENDING') {
    throw new AppError(`Este retiro ya fue procesado con estado: ${payout.status}`, 400);
  }

  if (action === 'PAID') {
    return prisma.creatorPayout.update({
      where: { id: payoutId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        adminNotes: adminNotes || 'Pago procesado exitosamente por administración',
      },
    });
  } else {
    // Si se rechaza, devolvemos el saldo a la creadora
    return prisma.$transaction([
      prisma.creatorCode.update({
        where: { id: payout.creatorCodeId },
        data: { balance: { increment: payout.amount } },
      }),
      prisma.creatorPayout.update({
        where: { id: payoutId },
        data: {
          status: 'REJECTED',
          adminNotes: adminNotes || 'Retiro rechazado por administración',
        },
      }),
    ]);
  }
}

/**
 * Obtiene el resumen financiero global para el panel del fundador/admin.
 */
export async function getFinancialSummaryAdmin() {
  const [totalLogs, allCodes, pendingPayouts] = await Promise.all([
    prisma.creatorEarningsLog.aggregate({
      _sum: {
        totalAmount: true,
        creatorCommission: true,
      },
      _count: true,
    }),
    prisma.creatorCode.findMany({
      select: {
        code: true,
        totalEarnings: true,
        balance: true,
        usesCount: true,
        user: { select: { username: true, displayName: true } },
      },
      orderBy: { totalEarnings: 'desc' },
      take: 10,
    }),
    prisma.creatorPayout.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalGrossUSD = totalLogs._sum.totalAmount || 0;
  const totalCreatorCommissionsUSD = totalLogs._sum.creatorCommission || 0;
  const serverFundUSD = Math.round(totalGrossUSD * 0.35 * 100) / 100;
  const netFounderProfitUSD = Math.round(totalGrossUSD * 0.30 * 100) / 100;

  return {
    totalGrossUSD,
    serverFundUSD, // 35% para servidores y mejoras
    totalCreatorCommissionsUSD, // 35% para creadoras
    netFounderProfitUSD, // 30% ganancia neta fundador y staff
    totalPurchasesCount: totalLogs._count,
    pendingPayoutsAmount: pendingPayouts._sum.amount || 0,
    pendingPayoutsCount: pendingPayouts._count,
    topCreators: allCodes,
  };
}
