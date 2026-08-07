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

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let canClaim = true;
  let claimedToday = false;
  let currentDay = 1;
  let streakSaved = false;

  if (lastClaim) {
    const lastClaimDateStr = new Date(lastClaim.claimedAt).toISOString().split('T')[0];

    if (lastClaimDateStr === todayStr) {
      // Already claimed today
      claimedToday = true;
      canClaim = false;
      currentDay = lastClaim.day;
    } else if (lastClaimDateStr === yesterdayStr) {
      // Claimed yesterday -> continue streak today!
      currentDay = lastClaim.day >= 7 ? 1 : lastClaim.day + 1;
    } else {
      // User missed one or more days. Check if user has an unused STREAK_SAVER consumable item
      const streakSaver = await prisma.userPurchase.findFirst({
        where: {
          userId,
          item: { type: 'STREAK_SAVER' },
        },
      });

      if (streakSaver) {
        // Streak protected by Escudo de Racha!
        streakSaved = true;
        currentDay = lastClaim.day >= 7 ? 1 : lastClaim.day + 1;
      } else {
        // Streak broken, reset to Day 1
        currentDay = 1;
      }
    }
  }

  // Next reward is available at midnight UTC (start of next calendar day)
  const tomorrow = new Date(now);
  tomorrow.setUTCHours(24, 0, 0, 0);

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
    claimedToday,
    currentDay,
    streakSaved,
    lastClaimedDay: lastClaim ? lastClaim.day : null,
    nextRewardAt: tomorrow.toISOString(),
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

  // ── Atomic anti-double-claim guard ────────────────────────────────
  // Create the claim record FIRST with a unique (userId, claimDate) key. If a
  // parallel request already claimed today, the unique constraint rejects this
  // one (P2002), so two concurrent /claim calls can never both be rewarded.
  const todayStr = new Date().toISOString().split('T')[0];
  try {
    await prisma.dailyReward.create({
      data: {
        userId,
        day: reward.day,
        xpAwarded: reward.xp,
        bonus: reward.bonus || false,
        claimDate: todayStr,
      },
    });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      throw new AppError('Ya reclamaste tu recompensa hoy. Vuelve en 24h.', 429);
    }
    throw err;
  }

  // If streak was protected by a STREAK_SAVER, consume 1 item from inventory now
  let usedStreakSaver = false;
  if (status.streakSaved) {
    const streakSaver = await prisma.userPurchase.findFirst({
      where: {
        userId,
        item: { type: 'STREAK_SAVER' },
      },
    });

    if (streakSaver) {
      if (streakSaver.remaining !== null && streakSaver.remaining !== undefined && streakSaver.remaining > 1) {
        await prisma.userPurchase.update({
          where: { id: streakSaver.id },
          data: { remaining: streakSaver.remaining - 1 },
        });
      } else {
        await prisma.userPurchase.delete({
          where: { id: streakSaver.id },
        });
      }
      usedStreakSaver = true;
    }
  }

  // Award XP & Stardust
  await GamificationRepository.addXpToUser(userId, reward.xp);
  await addStardust(userId, Math.round(reward.xp / 2), `Recompensa Diaria Día ${reward.day}`).catch(() => {});
  await trackMissionProgress(userId, 'DAILY_LOGIN').catch(() => {});

  return {
    day: reward.day,
    xpAwarded: reward.xp,
    bonus: reward.bonus || false,
    label: reward.label,
    usedStreakSaver,
    message: `+${reward.xp} XP — ${reward.bonus ? '¡BONUS!' : `Día ${reward.day}`}${usedStreakSaver ? ' 🛡️ (¡Escudo de Racha usado!)' : ''}`,
  };
};
