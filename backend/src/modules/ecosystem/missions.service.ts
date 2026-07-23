import prisma from '../../database/prisma';
import AppError from '../../errors/AppError';
import { addStardust } from './stardust.service';
import { awardCustomXp } from '../gamification/gamification.service';

export const DEFAULT_MISSIONS = [
  {
    title: '⭐ Publica una historia o post',
    description: 'Comparte un pensamiento, clip o imagen con la comunidad',
    type: 'DAILY',
    goal: 1,
    action: 'POST_CREATE',
    xpReward: 100,
    stardustReward: 50,
  },
  {
    title: '💬 Comenta en la comunidad',
    description: 'Deja al menos 3 comentarios en publicaciones de otros miembros',
    type: 'DAILY',
    goal: 3,
    action: 'COMMENT_CREATE',
    xpReward: 60,
    stardustReward: 30,
  },
  {
    title: '🔥 Reacciona con estrellas',
    description: 'Reacciona a 10 publicaciones o comentarios en el feed',
    type: 'DAILY',
    goal: 10,
    action: 'POST_LIKE',
    xpReward: 40,
    stardustReward: 20,
  },
  {
    title: '🌸 Visita un VTuber',
    description: 'Explora el perfil de cualquier VTuber de la comunidad',
    type: 'DAILY',
    goal: 1,
    action: 'VTUBER_VISIT',
    xpReward: 40,
    stardustReward: 20,
  },
  {
    title: '🎪 Participa en un evento o grupo',
    description: 'Únete a un evento o canal de Constelación',
    type: 'DAILY',
    goal: 1,
    action: 'EVENT_JOIN',
    xpReward: 80,
    stardustReward: 40,
  },
  {
    title: '✨ Conexión Estelar Diaria',
    description: 'Entra a Gremio Estelar hoy',
    type: 'DAILY',
    goal: 1,
    action: 'DAILY_LOGIN',
    xpReward: 30,
    stardustReward: 15,
  },
];

export const seedDefaultMissions = async () => {
  for (const m of DEFAULT_MISSIONS) {
    const existing = await prisma.mission.findFirst({
      where: { action: m.action, type: m.type },
    });
    if (!existing) {
      await prisma.mission.create({ data: m });
    }
  }
};

const getTodayResetDate = (): Date => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
};

export const getUserMissions = async (userId: string) => {
  await seedDefaultMissions();
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

  return missions.map(m => {
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
