import prisma from '../../database/prisma';

export const findAllAchievements = () =>
  prisma.achievement.findMany({ orderBy: { name: 'asc' } });

export const findAchievementByName = (name: string) =>
  prisma.achievement.findUnique({ where: { name } });

export const createAchievement = (data: { name: string; description: string; iconUrl?: string; xpReward: number; category: string }) =>
  prisma.achievement.create({ data });

export const findUserAchievements = (userId: string) =>
  prisma.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
    orderBy: { earnedAt: 'desc' },
  });

export const findUserAchievement = (userId: string, achievementId: string) =>
  prisma.userAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId } },
  });

export const awardAchievementToUser = (userId: string, achievementId: string) =>
  prisma.userAchievement.create({
    data: { userId, achievementId },
    include: { achievement: true },
  });

export const getUserGamificationProfile = (userId: string) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      xp: true,
      level: true,
      vtuberProfile: { select: { displayName: true, avatarUrl: true } },
    },
  });

export const addXpToUser = (userId: string, xp: number) =>
  prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: xp } },
  });

export const setUserLevel = (userId: string, level: number) =>
  prisma.user.update({
    where: { id: userId },
    data: { level },
  });

export const getLeaderboard = (limit = 50) =>
  prisma.user.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { xp: 'desc' },
    take: limit,
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      role: true,
      xp: true,
      level: true,
      vtuberProfile: { select: { displayName: true, avatarUrl: true } },
    },
  });
