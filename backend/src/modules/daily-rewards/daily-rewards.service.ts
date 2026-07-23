import AppError from '../../errors/AppError';
import prisma from '../../database/prisma';
import * as GamificationRepository from '../gamification/gamification.repository';
import { addStardust } from '../ecosystem/stardust.service';
import { trackMissionProgress } from '../ecosystem/missions.service';
import * as GamificationService from '../gamification/gamification.service';

const DAILY_REWARDS = [
  { day: 1, xp: 50, label: 'Día 1 — 50 XP' },
  { day: 2, xp: 75, label: 'Día 2 — 75 XP' },
  { day: 3, xp: 100, label: 'Día 3 — 100 XP' },
  { day: 4, xp: 150, label: 'Día 4 — 150 XP' },
  { day: 5, xp: 200, label: 'Día 5 — 200 XP' },
  { day: 6, xp: 250, label: 'Día 6 — 250 XP' },
  { day: 7, xp: 500, label: 'Día 7 — ¡BONUS! 500 XP', bonus: true },
];

export const getStatus = async (userId: string) => {
  // Find the last claim
  const lastClaim = await prisma.dailyReward.findFirst({
    where: { userId },
    orderBy: { claimedAt: 'desc' },
  });

  const now = Date.now();
  const canClaim = !lastClaim || (now - lastClaim.claimedAt.getTime() >= 24 * 60 * 60 * 1000);

  // Calculate current streak day
  let currentDay = 1;
  if (lastClaim) {
    const hoursSinceClaim = (now - lastClaim.claimedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceClaim < 48) {
      // Within the window, continue streak
      currentDay = lastClaim.day >= 7 ? 1 : lastClaim.day + 1;
    } else {
      // Streak broken, reset
      currentDay = 1;
    }
  }

  // Get all claims (history)
  const history = await prisma.dailyReward.findMany({
    where: { userId },
    orderBy: { claimedAt: 'desc' },
    take: 30,
  });

  // Count total claims
  const totalClaims = await prisma.dailyReward.count({ where: { userId } });

  return {
    canClaim,
    currentDay,
    nextRewardAt: lastClaim ? new Date(lastClaim.claimedAt.getTime() + 24 * 60 * 60 * 1000).toISOString() : null,
    rewards: DAILY_REWARDS,
    history: history.map(h => ({
      day: h.day,
      xpAwarded: h.xpAwarded,
      bonus: h.bonus,
      claimedAt: h.claimedAt.toISOString(),
    })),
    totalClaims,
  };
};

export const claim = async (userId: string) => {
  const status = await getStatus(userId);
  if (!status.canClaim) {
    throw new AppError('Ya reclamaste tu recompensa hoy. Vuelve en 24h.', 429);
  }

  const reward = DAILY_REWARDS.find(r => r.day === status.currentDay) || DAILY_REWARDS[0];

  // Award XP & Stardust
  await GamificationRepository.addXpToUser(userId, reward.xp);
  await addStardust(userId, Math.round(reward.xp / 2), `Recompensa Diaria Día ${reward.day}`).catch(() => {});
  await trackMissionProgress(userId, 'DAILY_LOGIN').catch(() => {});

  // Record the claim
  await prisma.dailyReward.create({
    data: {
      userId,
      day: reward.day,
      xpAwarded: reward.xp,
      bonus: reward.bonus || false,
    },
  });

  return {
    day: reward.day,
    xpAwarded: reward.xp,
    bonus: reward.bonus || false,
    label: reward.label,
    message: `+${reward.xp} XP — ${reward.bonus ? '¡BONUS!' : `Día ${reward.day}`}`,
  };
};
