import crypto from 'crypto';
import { prisma } from '../../database/index';
import { addStardust } from '../ecosystem/stardust.service';
import { trackMissionProgress } from '../ecosystem/missions.service';
import { isStaffRole } from '@gremio-estelar/shared';

// Whitelist de testers y administradores autorizados para pruebas
const WHITELISTED_USERS = [
  'hoshi',
  'hoshi hoshi',
  'hoshihoshi',
  'gremioestelar',
  'ryu',
  'guren',
];

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'trashmail.com',
  'yopmail.com',
  'throwawaymail.com',
  'sharklasers.com',
  'guerrillamailblock.com',
  'grr.la',
  'dispostable.com',
  'getairmail.com',
  'fakeinbox.com',
  'tempinbox.com',
  'mytemp.email',
]);

export const hashIp = (ip?: string): string | null => {
  if (!ip || ip.trim() === '') return null;
  const salt = process.env.JWT_SECRET || 'gremio_estelar_referral_salt_2026';
  return crypto.createHmac('sha256', salt).update(ip.trim()).digest('hex');
};

export const isWhitelistedUser = (user?: {
  id?: string;
  username?: string | null;
  displayName?: string | null;
  role?: string | null;
} | null): boolean => {
  if (!user) return false;
  if (user.role && (isStaffRole(user.role) || ['ADMIN', 'OWNER'].includes(user.role.toUpperCase()))) {
    return true;
  }
  const uName = (user.username || '').toLowerCase().trim();
  const dName = (user.displayName || '').toLowerCase().trim();
  const uClean = uName.replace(/[\s_-]+/g, '');
  const dClean = dName.replace(/[\s_-]+/g, '');

  for (const item of WHITELISTED_USERS) {
    const itemClean = item.toLowerCase().replace(/[\s_-]+/g, '');
    if (uClean === itemClean || dClean === itemClean || uName.includes(item) || dName.includes(item)) {
      return true;
    }
  }
  return false;
};

export const isDisposableEmail = (email?: string | null): boolean => {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1]?.toLowerCase().trim();
  return domain ? DISPOSABLE_EMAIL_DOMAINS.has(domain) : false;
};

/**
 * Procesa y registra una referencia con protecciones anti-multicuenta y whitelist de testers
 */
export const processReferral = async (
  referrerIdentifier: string,
  newUserId: string,
  clientIp?: string,
) => {
  if (!referrerIdentifier || !newUserId) return null;

  try {
    const refClean = referrerIdentifier.trim().toLowerCase();

    // 1. Buscar al referente por username o id
    const referrer = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: refClean, mode: 'insensitive' } },
          { id: refClean },
        ],
      },
      select: { id: true, username: true, displayName: true, role: true, email: true },
    });

    if (!referrer || referrer.id === newUserId) {
      return null;
    }

    // 2. Comprobar si el nuevo usuario ya tiene una referencia asignada
    const existingReferral = await prisma.referral.findUnique({
      where: { referredUserId: newUserId },
    });
    if (existingReferral) {
      return existingReferral;
    }

    // 3. Obtener datos del nuevo usuario
    const newUser = await prisma.user.findUnique({
      where: { id: newUserId },
      select: { id: true, username: true, displayName: true, role: true, email: true },
    });
    if (!newUser) return null;

    const ipHash = hashIp(clientIp);
    const isWhitelisted = isWhitelistedUser(referrer) || isWhitelistedUser(newUser);

    let status = 'VALID';

    if (!isWhitelisted) {
      // Chequeo 1: Correo desechable
      if (isDisposableEmail(newUser.email)) {
        status = 'SUSPECT_MULTI_ACCOUNT';
      }

      // Chequeo 2: Misma IP ya utilizada por otro usuario en una invitación previa
      if (status === 'VALID' && ipHash) {
        const duplicateIp = await prisma.referral.findFirst({
          where: {
            ipHash,
            status: 'VALID',
          },
        });
        if (duplicateIp) {
          status = 'SUSPECT_MULTI_ACCOUNT';
        }
      }

      // Chequeo 3: Si no ha completado inscripción aún (displayName nulo), queda pendiente
      if (status === 'VALID' && !newUser.displayName) {
        status = 'PENDING_INSCRIPTION';
      }
    } else {
      // Tester o Admin: si aún no tiene displayName, queda pendiente de inscripción pero sin flags de multicuenta
      if (!newUser.displayName) {
        status = 'PENDING_INSCRIPTION';
      }
    }

    // 4. Crear el registro en Prisma
    const referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredUserId: newUser.id,
        ipHash,
        status,
        stardustAwarded: false,
      },
    });

    // 5. Si es válido inmediatamente (por ejemplo, ya tenía displayName): otorgar recompensas
    if (status === 'VALID') {
      await awardReferralRewards(referral.id, referrer, newUser);
    }

    return referral;
  } catch (err) {
    console.error('[REFERRAL] Error procesando invitación:', err);
    return null;
  }
};

/**
 * Otorga el Stardust, misiones y notificaciones para una referencia válida
 */
const awardReferralRewards = async (
  referralId: string,
  referrer: { id: string; username: string; displayName?: string | null },
  referred: { id: string; username: string; displayName?: string | null },
) => {
  try {
    await trackMissionProgress(referrer.id, 'INVITE_FRIEND').catch(() => {});
    await addStardust(referrer.id, 50, 'REFERRAL_BONUS').catch(() => {});
    await addStardust(referred.id, 50, 'WELCOME_REFERRAL_BONUS').catch(() => {});

    await prisma.referral.update({
      where: { id: referralId },
      data: { stardustAwarded: true },
    }).catch(() => {});

    const nameRef = referrer.displayName || referrer.username;
    const nameNew = referred.displayName || referred.username;

    await prisma.notification.create({
      data: {
        userId: referrer.id,
        type: 'referral_join',
        title: '✦ ¡Nuevo miembro invitado al Gremio!',
        message: `@${nameNew} se unió con tu enlace y selló su inscripción. (+50 ⭐ Stardust)`,
        referenceId: referred.id,
      },
    }).catch(() => {});

    await prisma.notification.create({
      data: {
        userId: referred.id,
        type: 'referral_welcome',
        title: '✦ ¡Bienvenido al Gremio Estelar!',
        message: `Recibiste +50 ⭐ Stardust de bienvenida por unirte con el enlace de @${nameRef}.`,
        referenceId: referrer.id,
      },
    }).catch(() => {});
  } catch (e) {
    console.error('[REFERRAL] Error otorgando recompensas:', e);
  }
};

/**
 * Valida invitaciones pendientes cuando el usuario sella su inscripción en el Gremio
 */
export const validatePendingReferralOnInscription = async (userId: string) => {
  try {
    const referral = await prisma.referral.findUnique({
      where: { referredUserId: userId },
      include: {
        referrer: { select: { id: true, username: true, displayName: true, role: true } },
        referredUser: { select: { id: true, username: true, displayName: true, role: true } },
      },
    });

    if (!referral) return null;

    if (referral.status === 'PENDING_INSCRIPTION') {
      const updated = await prisma.referral.update({
        where: { id: referral.id },
        data: { status: 'VALID' },
      });

      if (!referral.stardustAwarded) {
        await awardReferralRewards(referral.id, referral.referrer, referral.referredUser);
      }

      return updated;
    }

    return referral;
  } catch (err) {
    console.error('[REFERRAL] Error validando inscripción de referido:', err);
    return null;
  }
};

/**
 * Obtiene las estadísticas de invitaciones y enlace del usuario
 */
export const getMyReferrals = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, displayName: true, role: true },
  });

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId },
    include: {
      referredUser: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const validCount = referrals.filter((r) => r.status === 'VALID').length;
  const pendingCount = referrals.filter((r) => r.status === 'PENDING_INSCRIPTION').length;
  const invalidCount = referrals.filter((r) => r.status.startsWith('SUSPECT_')).length;

  // Calcular ranking actual en la campaña
  const allValidGroups = await prisma.referral.groupBy({
    by: ['referrerId'],
    where: { status: 'VALID' },
    _count: { id: true },
    orderBy: {
      _count: { id: 'desc' },
    },
  });

  const userIndex = allValidGroups.findIndex((g) => g.referrerId === userId);
  const rank = userIndex >= 0 ? userIndex + 1 : (validCount > 0 ? allValidGroups.length + 1 : null);

  const baseUrl = process.env.FRONTEND_URL || 'https://gremioweb.com';
  const referralCode = user.username;
  const referralLink = `${baseUrl}/register?ref=${encodeURIComponent(referralCode)}`;

  return {
    referralCode,
    referralLink,
    validCount,
    pendingCount,
    invalidCount,
    totalCount: referrals.length,
    rank,
    referrals: referrals.map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt,
      user: {
        id: r.referredUser.id,
        username: r.referredUser.username,
        displayName: r.referredUser.displayName || r.referredUser.username,
        avatarUrl: r.referredUser.avatarUrl,
        createdAt: r.referredUser.createdAt,
      },
    })),
  };
};

/**
 * Tabla de clasificación en vivo para la dinámica de Discord Nitro / VRChat Plus
 */
export const getReferralLeaderboard = async (limit = 10) => {
  const safeLimit = Math.min(Math.max(limit, 1), 50);

  const groups = await prisma.referral.groupBy({
    by: ['referrerId'],
    where: { status: 'VALID' },
    _count: { id: true },
    orderBy: {
      _count: { id: 'desc' },
    },
    take: safeLimit,
  });

  if (groups.length === 0) {
    return [];
  }

  const userIds = groups.map((g) => g.referrerId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      role: true,
      plan: true,
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return groups
    .map((g, index) => {
      const u = userMap.get(g.referrerId);
      if (!u) return null;
      return {
        rank: index + 1,
        id: u.id,
        username: u.username,
        displayName: u.displayName || u.username,
        avatarUrl: u.avatarUrl,
        plan: u.plan,
        role: u.role,
        verifiedInvites: g._count.id,
      };
    })
    .filter(Boolean);
};
