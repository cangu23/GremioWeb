import AppError from '../../errors/AppError';
import { getLevelFromXp, XP_REWARDS, isVerifiedEffective } from '@gremio-estelar/shared';
import * as GamificationRepository from './gamification.repository';
import * as NotificationsService from '../notifications/notifications.service';
import { getXpMultiplier } from '../subscriptions/platform-subscriptions.service';
import prisma from '../../database/prisma';

export const getMyGamificationProfile = async (userId: string) => {
  // Auto-check and award any newly qualified achievements
  await checkAndAwardUserAchievements(userId).catch(() => {});

  const profile = await GamificationRepository.getUserGamificationProfile(userId);
  if (!profile) throw new AppError('Usuario no encontrado', 404);

  const achievements = await GamificationRepository.findUserAchievements(userId);

  const xpProgress = {
    current: profile.xp,
    level: profile.level,
  };

  return {
    ...profile,
    achievements,
    xpProgress,
  };
};

export const getLeaderboard = async (limit = 50) => {
  const users = await GamificationRepository.getLeaderboard(limit);
  return users.map((u, i) => ({
    id: u.id,
    username: u.username,
    xp: u.xp,
    level: u.level,
    role: u.role,
    displayedRole: u.displayedRole,
    isVerified: isVerifiedEffective(u as any),
    avatarUrl: u.avatarUrl || u.vtuberProfile?.avatarUrl || null,
    displayName: u.displayName || u.vtuberProfile?.displayName || u.username,
    rank: i + 1,
  }));
};

export const getAllAchievements = async () => {
  let achievements = await GamificationRepository.findAllAchievements();
  if (achievements.length === 0) {
    await seedAchievements();
    achievements = await GamificationRepository.findAllAchievements();
  }
  return achievements;
};

export const awardXpForAction = async (userId: string, action: keyof typeof XP_REWARDS) => {
  const xpAmount = XP_REWARDS[action];
  if (!xpAmount) throw new AppError(`Acción '${action}' no tiene XP configurado`, 400);
  return awardXpBase(userId, xpAmount);
};

export const awardCustomXp = async (userId: string, amount: number) => {
  if (amount <= 0) throw new AppError('La cantidad de XP debe ser positiva', 400);
  return awardXpBase(userId, amount);
};

async function awardXpBase(userId: string, xpAmount: number) {
  const user = await GamificationRepository.getUserGamificationProfile(userId);
  if (!user) throw new AppError('Usuario no encontrado', 404);

  // Multiplicador de XP del plan efectivo (prometido en /premium:
  // ASTRO ×1.5, NOVA ×2, STELLAR ×3). Se aplica al XP BASE.
  const multiplier = getXpMultiplier((user as any).plan, (user as any).role);
  const finalXp = Math.max(1, Math.round(xpAmount * multiplier));

  await GamificationRepository.addXpToUser(userId, finalXp);

  let runningTotal = user.xp + finalXp;
  let runningLevel = getLevelFromXp(runningTotal);

  let levelUp = false;
  if (runningLevel > user.level) {
    await GamificationRepository.setUserLevel(userId, runningLevel);
    levelUp = true;
    await NotificationsService.notifyLevelUp(runningLevel, userId).catch(() => {});
  }

  // Check achievements after XP award
  const newAchievements = await checkAndAwardUserAchievements(userId);

  const updatedUser = await GamificationRepository.getUserGamificationProfile(userId);
  if (updatedUser) {
    runningTotal = updatedUser.xp;
    runningLevel = updatedUser.level;
  }

  return {
    xpAwarded: finalXp,
    baseXp: xpAmount,
    multiplier,
    totalXp: runningTotal,
    level: runningLevel,
    levelUp,
    newAchievements,
  };
}

/**
 * Check and award all achievements for a given user based on DB records
 */
export async function checkAndAwardUserAchievements(userId: string) {
  const user = await GamificationRepository.getUserGamificationProfile(userId);
  if (!user) return [];

  // Make sure default achievements are seeded
  const achievements = await getAllAchievements();
  const userAchievements = await GamificationRepository.findUserAchievements(userId);
  const userAchievementIds = new Set(userAchievements.map((ua: { achievementId: string }) => ua.achievementId));

  const newAchievements: Array<{ id: string; name: string; description: string; xpReward: number; category: string }> = [];

  let runningTotal = user.xp;
  let runningLevel = Math.max(user.level || 1, getLevelFromXp(user.xp));
  if (runningLevel > (user.level || 1)) {
    await GamificationRepository.setUserLevel(userId, runningLevel).catch(() => {});
  }

  // Cached DB counts to prevent duplicate queries inside loop
  let postCount: number | null = null;
  let commentCount: number | null = null;
  let dailyCount: number | null = null;
  let eventCount: number | null = null;
  let guildCount: number | null = null;
  let followCount: number | null = null;

  for (const achievement of achievements) {
    if (userAchievementIds.has(achievement.id)) continue;

    const name = achievement.name.toLowerCase();
    let unlocked = false;

    // 1. First steps
    if (name.includes('primeros pasos') || name.includes('first steps')) {
      unlocked = true;
    }
    // 2. Posts
    else if (name.includes('primer post') || name.includes('publicación')) {
      if (postCount === null) postCount = await prisma.post.count({ where: { userId } });
      unlocked = postCount >= 1;
    }
    // 3. Comments
    else if (name.includes('primer comentario') || name.includes('comentador')) {
      if (commentCount === null) commentCount = await prisma.comment.count({ where: { userId } });
      unlocked = commentCount >= 1;
    }
    // 4. Daily rewards & streaks
    else if (name.includes('señor del fuego') || name.includes('30 días')) {
      const spins = await prisma.rouletteSpin.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } });
      const dates = Array.from(new Set(spins.map(s => s.createdAt.toISOString().split('T')[0])));
      unlocked = dates.length >= 30;
    } else if (name.includes('invocador de la racha') || name.includes('7 días')) {
      const spins = await prisma.rouletteSpin.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } });
      const dates = Array.from(new Set(spins.map(s => s.createdAt.toISOString().split('T')[0])));
      unlocked = dates.length >= 7;
    } else if (name.includes('racha') || name.includes('diaria')) {
      if (dailyCount === null) {
        const dRewardCount = await prisma.dailyReward.count({ where: { userId } });
        const missionLoginCount = await prisma.userMissionProgress.count({
          where: { userId, completed: true },
        });
        dailyCount = dRewardCount + missionLoginCount;
      }
      unlocked = dailyCount >= 1;
    }
    // 5. Cosmic & Chest achievements
    else if (name.includes('cósmico') || name.includes('cosmic')) {
      const cosmicSpin = await prisma.rouletteSpin.findFirst({
        where: { userId, prize: { contains: 'cosmic' } }
      });
      unlocked = !!cosmicSpin;
    }
    // 6. Level based
    else if (name.includes('nivel 5') || name.includes('level 5')) {
      unlocked = runningLevel >= 5;
    } else if (name.includes('nivel 10') || name.includes('level 10')) {
      unlocked = runningLevel >= 10;
    }
    // 7. XP based
    else if (name.includes('100 xp') || name.includes('100xp')) {
      unlocked = runningTotal >= 100;
    } else if (name.includes('500 xp') || name.includes('500xp')) {
      unlocked = runningTotal >= 500;
    } else if (name.includes('1000 xp') || name.includes('1000xp')) {
      unlocked = runningTotal >= 1000;
    }
    // 8. Events (Creator vs Attendee)
    else if (name.includes('creador de eventos') || name.includes('crear evento')) {
      if (eventCount === null) {
        eventCount = await prisma.event.count({ where: { creatorId: userId } });
      }
      unlocked = eventCount >= 1;
    } else if (name.includes('evento')) {
      if (eventCount === null) {
        const created = await prisma.event.count({ where: { creatorId: userId } });
        const attended = await prisma.eventAttendee.count({ where: { userId } });
        eventCount = created + attended;
      }
      unlocked = eventCount >= 1;
    }
    // 9. Guilds (Founder vs Member)
    else if (name.includes('fundador de gremio') || name.includes('fundador')) {
      if (guildCount === null) {
        guildCount = await prisma.guild.count({ where: { creatorId: userId } });
      }
      unlocked = guildCount >= 1;
    } else if (name.includes('gremio')) {
      if (guildCount === null) {
        const created = await prisma.guild.count({ where: { creatorId: userId } });
        const member = await prisma.guildMember.count({ where: { userId } });
        guildCount = created + member;
      }
      unlocked = guildCount >= 1;
    }
    // 10. Social (Friends & Followers)
    else if (name.includes('social') || name.includes('sociable') || name.includes('seguidor')) {
      if (followCount === null) {
        const follows = await prisma.follow.count({
          where: { OR: [{ followerId: userId }, { followingId: userId }] },
        });
        const friends = await prisma.friend.count({
          where: { OR: [{ senderId: userId }, { receiverId: userId }] },
        });
        followCount = follows + friends;
      }
      unlocked = (followCount || 0) >= 1;
    }

    if (unlocked) {
      const awarded = await GamificationRepository.awardAchievementToUser(userId, achievement.id);
      newAchievements.push(awarded.achievement);
      await NotificationsService.notifyAchievement(achievement.name, userId, achievement.id).catch(() => {});

      if (achievement.xpReward > 0) {
        await GamificationRepository.addXpToUser(userId, achievement.xpReward);
        runningTotal += achievement.xpReward;
        const afterLevel = getLevelFromXp(runningTotal);
        if (afterLevel > runningLevel) {
          await GamificationRepository.setUserLevel(userId, afterLevel);
          runningLevel = afterLevel;
        }
      }
    }
  }

  return newAchievements;
}

// Seed default achievements
export const seedAchievements = async () => {
  const defaults = [
    { name: 'Primeros Pasos', description: 'Realiza tu primera acción en la plataforma', xpReward: 10, category: 'GENERAL' },
    { name: 'Primer Post', description: 'Publica tu primer mensaje en la comunidad', xpReward: 15, category: 'GENERAL' },
    { name: 'Primer Comentario', description: 'Escribe tu primer comentario en una publicación', xpReward: 15, category: 'GENERAL' },
    { name: 'Racha Diaria', description: 'Reclama tu primera recompensa diaria', xpReward: 20, category: 'GENERAL' },
    { name: 'Invocador de la Racha Mística', description: 'Mantén una racha de giros/login activa por 7 días consecutivos', xpReward: 1000, category: 'RACHA' },
    { name: 'Señor del Fuego Ininterrumpido', description: '¡Leyenda! Mantén tu racha diaria activa durante más de 30 días consecutivos', xpReward: 5000, category: 'RACHA' },
    { name: 'Pionero de la Racha Gremial', description: 'Insignia de Prestigio Asignada por Administradores a los pioneros en activar la racha gremial', xpReward: 2500, category: 'ESPECIAL' },
    { name: 'Coleccionista Cósmico', description: 'Desbloquea y abre un Cofre Estelar Cósmico en la Ruleta', xpReward: 3000, category: 'RULETA' },
    { name: 'Leyenda de la Comunidad', description: 'Máxima distinción asignada por administradores a miembros legendarios', xpReward: 10000, category: 'ESPECIAL' },
    { name: '100 XP', description: 'Acumula 100 puntos de experiencia', xpReward: 20, category: 'XP' },
    { name: '500 XP', description: 'Acumula 500 puntos de experiencia', xpReward: 50, category: 'XP' },
    { name: '1000 XP', description: 'Acumula 1000 puntos de experiencia', xpReward: 100, category: 'XP' },
    { name: 'Nivel 5', description: 'Alcanza el nivel 5', xpReward: 50, category: 'NIVEL' },
    { name: 'Nivel 10', description: 'Alcanza el nivel 10', xpReward: 100, category: 'NIVEL' },
    { name: 'Creador de Eventos', description: 'Crea tu primer evento', xpReward: 30, category: 'EVENTOS' },
    { name: 'Fundador de Gremio', description: 'Crea tu primer gremio en la comunidad', xpReward: 40, category: 'GREMIOS' },
    { name: 'Sociable', description: 'Conecta con tu primer amigo en la plataforma', xpReward: 20, category: 'SOCIAL' },
  ];

  for (const ach of defaults) {
    const existing = await GamificationRepository.findAchievementByName(ach.name);
    if (!existing) {
      await GamificationRepository.createAchievement(ach);
    }
  }
};

// Admin manual achievement assignment
export const awardAchievementManually = async (targetUserId: string, achievementId: string) => {
  const user = await GamificationRepository.getUserGamificationProfile(targetUserId);
  if (!user) throw new AppError('Usuario no encontrado', 404);

  const achievement = await prisma.achievement.findUnique({ where: { id: achievementId } });
  if (!achievement) throw new AppError('Logro no encontrado', 404);

  const awarded = await GamificationRepository.awardAchievementToUser(targetUserId, achievementId);
  await NotificationsService.notifyAchievement(achievement.name, targetUserId, achievement.id).catch(() => {});

  if (achievement.xpReward > 0) {
    await awardCustomXp(targetUserId, achievement.xpReward).catch(() => {});
  }

  return awarded;
};
