import prisma from '../../database/prisma';
import AppError from '../../errors/AppError';
import { addStardust } from './stardust.service';
import { awardCustomXp } from '../gamification/gamification.service';

export const DEFAULT_MISSIONS = [
  {
    title: '✨ Conexión Estelar Diaria',
    description: 'Entra a Gremio Estelar hoy y reclama tu energía estelar',
    type: 'DAILY',
    goal: 1,
    action: 'DAILY_LOGIN',
    xpReward: 50,
    stardustReward: 30,
  },
  {
    title: '💖 Esparcir Cariño',
    description: 'Reacciona a 3 publicaciones o imágenes en el feed',
    type: 'DAILY',
    goal: 3,
    action: 'POST_LIKE',
    xpReward: 50,
    stardustReward: 30,
  },
  {
    title: '💬 Charla en la Comunidad',
    description: 'Deja 1 comentario amigable en cualquier publicación',
    type: 'DAILY',
    goal: 1,
    action: 'COMMENT_CREATE',
    xpReward: 60,
    stardustReward: 40,
  },
  {
    title: '🌸 Exploración VTuber',
    description: 'Visita el perfil de cualquier VTuber de la comunidad',
    type: 'DAILY',
    goal: 1,
    action: 'VTUBER_VISIT',
    xpReward: 50,
    stardustReward: 30,
  },
  {
    title: '🍖 Cuida a una Mascota',
    description: 'Alimenta a tu mascota o a la de un amigo',
    type: 'DAILY',
    goal: 1,
    action: 'PET_FEED',
    xpReward: 60,
    stardustReward: 40,
  },
  {
    title: '🛍️ Escaparate Estelar',
    description: 'Visita la Tienda Estelar de la comunidad',
    type: 'DAILY',
    goal: 1,
    action: 'SHOP_VISIT',
    xpReward: 40,
    stardustReward: 25,
  },
  {
    title: '📝 Pensamiento del Día',
    description: 'Actualiza la nota o estado de tu perfil',
    type: 'DAILY',
    goal: 1,
    action: 'NOTE_UPDATE',
    xpReward: 50,
    stardustReward: 30,
  },
  {
    title: '🤝 Ampliar el Gremio',
    description: 'Sigue a un miembro o VTuber de la comunidad',
    type: 'DAILY',
    goal: 1,
    action: 'USER_FOLLOW',
    xpReward: 50,
    stardustReward: 30,
  },
  {
    title: '👑 Cambia tu Estilo',
    description: 'Equipa o cambia un título o marco en tu inventario',
    type: 'DAILY',
    goal: 1,
    action: 'EQUIP_ITEM',
    xpReward: 45,
    stardustReward: 30,
  },
];

export const seedDefaultMissions = async () => {
  // Deactivate old impossible or forced missions (e.g. EVENT_JOIN, forced POST_CREATE)
  await prisma.mission.updateMany({
    where: { action: { in: ['EVENT_JOIN', 'POST_CREATE'] } },
    data: { active: false },
  });

  for (const m of DEFAULT_MISSIONS) {
    const existing = await prisma.mission.findFirst({
      where: { action: m.action, type: m.type },
    });
    if (!existing) {
      await prisma.mission.create({ data: { ...m, active: true } });
    } else {
      await prisma.mission.update({
        where: { id: existing.id },
        data: {
          title: m.title,
          description: m.description,
          goal: m.goal,
          xpReward: m.xpReward,
          stardustReward: m.stardustReward,
          active: true,
        },
      });
    }
  }
};

const getDailyRotatedMissions = (missions: any[], userId: string): any[] => {
  const loginMission = missions.find(m => m.action === 'DAILY_LOGIN');
  const pool = missions.filter(m => m.action !== 'DAILY_LOGIN');

  if (pool.length === 0) return missions;

  // Today's date string YYYY-MM-DD
  const dateStr = new Date().toISOString().slice(0, 10);
  const seedString = `${userId}-${dateStr}`;

  // Simple deterministic hash
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  const positiveSeed = Math.abs(hash);

  // Sort pool deterministically based on seed + mission action
  const sortedPool = [...pool].sort((a, b) => {
    const valA = (positiveSeed + a.action.charCodeAt(0) * 17) % 1000;
    const valB = (positiveSeed + b.action.charCodeAt(0) * 17) % 1000;
    return valA - valB;
  });

  // Select 3 rotated pool missions for today
  const todaysRotated = sortedPool.slice(0, 3);

  return loginMission ? [loginMission, ...todaysRotated] : todaysRotated;
};

const getTodayResetDate = (): Date => {
  const date = new Date();
  date.setHours(23, 59, 59, 0);
  return date;
};

export const getUserMissions = async (userId: string) => {
  await seedDefaultMissions();
  await trackMissionProgress(userId, 'DAILY_LOGIN').catch(() => {});
  const resetAt = getTodayResetDate();

  const missions = await prisma.mission.findMany({
    where: { active: true },
    orderBy: { createdAt: 'asc' },
  });

  const progressRecords = await prisma.userMissionProgress.findMany({
    where: {
      userId,
      resetAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
  });

  const progressMap = new Map(progressRecords.map(p => [p.missionId, p]));

  const mapped = missions.map(m => {
    const userProgress = progressMap.get(m.id);
    return {
      id: m.id,
      title: m.title,
      description: m.description,
      type: m.type,
      goal: m.goal,
      action: m.action,
      xpReward: m.xpReward,
      stardustReward: m.stardustReward,
      currentProgress: userProgress ? userProgress.progress : 0,
      completed: userProgress ? userProgress.completed : false,
      claimedAt: userProgress?.claimedAt ? userProgress.claimedAt.toISOString() : null,
    };
  });

  // Select today's 4 active missions for this user
  const todaysMissions = getDailyRotatedMissions(mapped, userId);

  return todaysMissions.sort((a, b) => {
    const aClaimed = !!a.claimedAt;
    const bClaimed = !!b.claimedAt;
    const aDone = a.completed || a.currentProgress >= a.goal;
    const bDone = b.completed || b.currentProgress >= b.goal;

    const getPriority = (claimed: boolean, done: boolean) => {
      if (done && !claimed) return 0; // Ready to claim (TOP)
      if (!done && !claimed) return 1; // In progress (MIDDLE)
      return 2; // Claimed / Completed (BOTTOM)
    };

    return getPriority(aClaimed, aDone) - getPriority(bClaimed, bDone);
  });
};

export const trackMissionProgress = async (userId: string, action: string, amount = 1) => {
  try {
    const resetAt = getTodayResetDate();
    const missions = await prisma.mission.findMany({
      where: { action, active: true },
    });

    for (const mission of missions) {
      const existing = await prisma.userMissionProgress.findUnique({
        where: {
          userId_missionId_resetAt: {
            userId,
            missionId: mission.id,
            resetAt,
          },
        },
      });

      if (existing?.completed) continue;

      const newProgress = Math.min(mission.goal, (existing?.progress || 0) + amount);
      const isCompleted = newProgress >= mission.goal;

      await prisma.userMissionProgress.upsert({
        where: {
          userId_missionId_resetAt: {
            userId,
            missionId: mission.id,
            resetAt,
          },
        },
        update: {
          progress: newProgress,
          completed: isCompleted,
        },
        create: {
          userId,
          missionId: mission.id,
          progress: newProgress,
          completed: isCompleted,
          resetAt,
        },
      });
    }
  } catch (err) {
    console.error('Error tracking mission progress:', err);
  }
};

export const claimMissionReward = async (userId: string, missionId: string) => {
  const resetAt = getTodayResetDate();
  const mission = await prisma.mission.findUnique({ where: { id: missionId } });

  if (!mission) throw new AppError('Misión no encontrada', 404);

  const progress = await prisma.userMissionProgress.findUnique({
    where: {
      userId_missionId_resetAt: {
        userId,
        missionId,
        resetAt,
      },
    },
  });

  if (!progress || !progress.completed) {
    throw new AppError('Aún no has completado esta misión', 400);
  }

  if (progress.claimedAt) {
    throw new AppError('Ya reclamaste la recompensa de esta misión', 400);
  }

  // Mark as claimed
  await prisma.userMissionProgress.update({
    where: { id: progress.id },
    data: { claimedAt: new Date() },
  });

  // Award XP and Stardust
  await awardCustomXp(userId, mission.xpReward).catch(() => {});
  const stardustResult = await addStardust(userId, mission.stardustReward, `Misión completada: ${mission.title}`);
  const earned = typeof stardustResult === 'object' && stardustResult ? stardustResult.stardustEarned : mission.stardustReward;

  return {
    message: `¡Recompensa reclamada! +${mission.xpReward} XP y +${earned} Stardust ⭐`,
    xpAwarded: mission.xpReward,
    stardustAwarded: earned,
  };
};

export const claimAllMissions = async (userId: string) => {
  const userMissions = await getUserMissions(userId);
  const claimable = userMissions.filter(m => m.completed && !m.claimedAt);

  if (claimable.length === 0) {
    throw new AppError('No tienes misiones completadas pendientes por reclamar', 400);
  }

  const resetAt = getTodayResetDate();
  let totalXp = 0;
  let totalStardust = 0;

  for (const m of claimable) {
    const progress = await prisma.userMissionProgress.findUnique({
      where: {
        userId_missionId_resetAt: {
          userId,
          missionId: m.id,
          resetAt,
        },
      },
    });

    if (progress && progress.completed && !progress.claimedAt) {
      await prisma.userMissionProgress.update({
        where: { id: progress.id },
        data: { claimedAt: new Date() },
      });
      totalXp += m.xpReward;
      totalStardust += m.stardustReward;
    }
  }

  if (totalXp > 0) {
    await awardCustomXp(userId, totalXp).catch(() => {});
  }
  if (totalStardust > 0) {
    await addStardust(userId, totalStardust, `Recompensa por Misiones (Reclamar Todo - ${claimable.length} misiones)`);
  }

  return {
    message: `¡Has reclamado ${claimable.length} misión(es)! +${totalXp} XP y +${totalStardust} ⭐ Stardust`,
    claimedCount: claimable.length,
    totalXp,
    totalStardust,
  };
};

export const STREAK_REWARDS = [
  { day: 1, stardust: 15, xp: 0, label: '15 Stardust ⭐' },
  { day: 2, stardust: 25, xp: 50, label: '25 Stardust + 50 XP' },
  { day: 3, stardust: 40, xp: 0, label: '40 Stardust ⭐' },
  { day: 4, stardust: 60, xp: 0, label: '60 Stardust ⭐' },
  { day: 5, stardust: 75, xp: 150, label: '75 Stardust + 150 XP' },
  { day: 6, stardust: 100, xp: 0, label: '100 Stardust ⭐' },
  { day: 7, stardust: 300, xp: 300, isChest: true, label: '¡Cofre Misterioso + 300 Stardust!' },
];

export const getDailyStreak = async (userId: string) => {
  await trackMissionProgress(userId, 'DAILY_LOGIN').catch(() => {});
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check login check-in progress
  const loginMission = await prisma.mission.findFirst({ where: { action: 'DAILY_LOGIN' } });
  let currentStreak = 1;
  let hasCheckedInToday = false;

  if (loginMission) {
    const todayProgress = await prisma.userMissionProgress.findFirst({
      where: {
        userId,
        missionId: loginMission.id,
        resetAt: { gte: today },
      },
    });

    if (todayProgress) {
      hasCheckedInToday = !!todayProgress.claimedAt || todayProgress.completed;
    }

    // Count recent check-ins in the last 7 days
    const recentCheckins = await prisma.userMissionProgress.count({
      where: {
        userId,
        missionId: loginMission.id,
        completed: true,
        resetAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });
    currentStreak = Math.min(7, Math.max(1, recentCheckins));
  }

  return {
    currentStreak,
    hasCheckedInToday,
    days: STREAK_REWARDS.map(r => ({
      ...r,
      isCompleted: r.day <= currentStreak && hasCheckedInToday,
      isCurrent: r.day === currentStreak,
    })),
  };
};

export const getCommunityChallenge = async () => {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const postsCount = await prisma.post.count({ where: { createdAt: { gte: weekAgo } } });
  const commentsCount = await prisma.comment.count({ where: { createdAt: { gte: weekAgo } } });
  
  const totalContrib = postsCount + commentsCount;
  const GOAL = 250;
  const progressPct = Math.min(100, Math.round((totalContrib / GOAL) * 100));

  return {
    title: '🌐 Desafío Semanal de la Comunidad',
    description: 'Entre todos los miembros del Gremio, alcancen 250 publicaciones y comentarios esta semana.',
    goal: GOAL,
    currentProgress: totalContrib,
    progressPct,
    completed: totalContrib >= GOAL,
    rewardStardust: 300,
    rewardXp: 200,
  };
};


