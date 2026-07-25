import AppError from '../../errors/AppError';
import prisma from '../../database/prisma';
import * as GamificationRepository from '../gamification/gamification.repository';
import { addStardust, spendStardust, getStardustBalance } from '../ecosystem/stardust.service';

// Roulette prize pool
const PRIZES = [
  { id: 'xp_10', label: '10 XP', value: 10, weight: 30, color: '#8B5CF6' },
  { id: 'xp_25', label: '25 XP', value: 25, weight: 25, color: '#7C3AED' },
  { id: 'xp_50', label: '50 XP', value: 50, weight: 20, color: '#6D28D9' },
  { id: 'xp_100', label: '100 XP', value: 100, weight: 12, color: '#5B21B6' },
  { id: 'xp_200', label: '200 XP', value: 200, weight: 7, color: '#4C1D95' },
  { id: 'xp_500', label: '500 XP', value: 500, weight: 3, color: '#F59E0B' },
  { id: 'badge_lucky', label: 'Insignia Suertuda', value: 0, weight: 2, color: '#EF4444' },
  { id: 'nothing', label: '¡Suerte para la próxima!', value: 0, weight: 1, color: '#6B7280' },
];

const TOTAL_WEIGHT = PRIZES.reduce((sum, p) => sum + p.weight, 0);
export const EXTRA_SPIN_STARDUST_COST = 50;

function pickPrize() {
  const rand = Math.random() * TOTAL_WEIGHT;
  let cumulative = 0;
  for (const prize of PRIZES) {
    cumulative += prize.weight;
    if (rand <= cumulative) return prize;
  }
  return PRIZES[0];
}

export const calculateStreak = async (userId: string) => {
  const spins = await prisma.rouletteSpin.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  if (spins.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // Extract unique YYYY-MM-DD dates in order
  const dates = Array.from(
    new Set(spins.map((s) => s.createdAt.toISOString().split('T')[0]))
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  let currentStreak = 0;

  // Check if most recent spin is today or yesterday
  if (dates[0] === todayStr || dates[0] === yesterdayStr) {
    let checkDate = new Date(dates[0]);
    for (let i = 0; i < dates.length; i++) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (dates.includes(dStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate best streak historically
  let bestStreak = 0;
  let tempStreak = 0;
  if (dates.length > 0) {
    let runningDate = new Date(dates[0]);
    tempStreak = 1;
    bestStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prevExpected = new Date(runningDate);
      prevExpected.setDate(prevExpected.getDate() - 1);
      const prevExpectedStr = prevExpected.toISOString().split('T')[0];

      if (dates[i] === prevExpectedStr) {
        tempStreak++;
        runningDate = prevExpected;
      } else {
        runningDate = new Date(dates[i]);
        tempStreak = 1;
      }
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    }
  }

  return { currentStreak, bestStreak };
};

export const getStatus = async (userId: string) => {
  const lastSpin = await prisma.rouletteSpin.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const now = Date.now();
  const canSpin = !lastSpin || (now - lastSpin.createdAt.getTime() >= 24 * 60 * 60 * 1000);
  const streakInfo = await calculateStreak(userId);
  const stardustInfo = await getStardustBalance(userId).catch(() => ({ stardust: 0 }));

  const streakBonusPercent = Math.min(50, Math.max(0, (streakInfo.currentStreak - 1) * 5));

  return {
    canSpin,
    nextSpinAt: lastSpin ? new Date(lastSpin.createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString() : null,
    prizes: PRIZES,
    currentStreak: streakInfo.currentStreak,
    bestStreak: streakInfo.bestStreak,
    streakBonusPercent,
    stardustCostForExtraSpin: EXTRA_SPIN_STARDUST_COST,
    userStardust: stardustInfo.stardust,
  };
};

export const spin = async (userId: string) => {
  const status = await getStatus(userId);
  if (!status.canSpin) {
    throw new AppError('Ya giraste la ruleta hoy. Vuelve en 24h o gira con Polvo Estelar.', 429);
  }

  const prize = pickPrize();
  const streakBonusPercent = status.streakBonusPercent || 0;
  const finalXp = prize.value > 0 ? Math.round(prize.value * (1 + streakBonusPercent / 100)) : 0;

  // Award XP and Stardust
  if (finalXp > 0) {
    await GamificationRepository.addXpToUser(userId, finalXp);
    await addStardust(userId, Math.round(finalXp / 2), `Ruleta: ${prize.label}`).catch(() => {});
  }

  // Record spin
  await prisma.rouletteSpin.create({
    data: {
      userId,
      prize: prize.id,
      prizeLabel: prize.label,
      prizeValue: finalXp,
    },
  });

  const prizeIndex = PRIZES.findIndex((p) => p.id === prize.id);
  const segmentAngle = 360 / PRIZES.length;
  const targetAngle = segmentAngle * prizeIndex;
  const randomOffset = Math.random() * segmentAngle * 0.8;
  const rotation = 720 + (360 - targetAngle - randomOffset);

  return {
    prize,
    rotation,
    finalXp,
    streakBonusPercent,
    message: finalXp > 0
      ? `¡Ganaste ${prize.label}!${streakBonusPercent > 0 ? ` (+${streakBonusPercent}% bono racha)` : ''}`
      : prize.id === 'nothing'
        ? 'No ganaste nada esta vez. ¡Intenta mañana!'
        : `¡Ganaste ${prize.label}!`,
  };
};

export const spinWithStardust = async (userId: string) => {
  await spendStardust(userId, EXTRA_SPIN_STARDUST_COST, 'Giro extra de Ruleta');

  const prize = pickPrize();
  const streakInfo = await calculateStreak(userId);
  const streakBonusPercent = Math.min(50, Math.max(0, (streakInfo.currentStreak - 1) * 5));
  const finalXp = prize.value > 0 ? Math.round(prize.value * (1 + streakBonusPercent / 100)) : 0;

  if (finalXp > 0) {
    await GamificationRepository.addXpToUser(userId, finalXp);
    await addStardust(userId, Math.round(finalXp / 2), `Ruleta (Extra): ${prize.label}`).catch(() => {});
  }

  await prisma.rouletteSpin.create({
    data: {
      userId,
      prize: prize.id,
      prizeLabel: prize.label,
      prizeValue: finalXp,
    },
  });

  const prizeIndex = PRIZES.findIndex((p) => p.id === prize.id);
  const segmentAngle = 360 / PRIZES.length;
  const targetAngle = segmentAngle * prizeIndex;
  const randomOffset = Math.random() * segmentAngle * 0.8;
  const rotation = 720 + (360 - targetAngle - randomOffset);

  return {
    prize,
    rotation,
    finalXp,
    streakBonusPercent,
    message: finalXp > 0
      ? `¡Ganaste ${prize.label}!${streakBonusPercent > 0 ? ` (+${streakBonusPercent}% bono racha)` : ''}`
      : prize.id === 'nothing'
        ? 'No ganaste nada esta vez.'
        : `¡Ganaste ${prize.label}!`,
  };
};

export const getStats = async (userId: string) => {
  const spins = await prisma.rouletteSpin.findMany({
    where: { userId },
  });

  const totalSpins = spins.length;
  const totalXpEarned = spins.reduce((sum, s) => sum + (s.prizeValue || 0), 0);
  const highestXpWon = spins.reduce((max, s) => Math.max(max, s.prizeValue || 0), 0);
  const streakInfo = await calculateStreak(userId);

  return {
    totalSpins,
    totalXpEarned,
    highestXpWon,
    currentStreak: streakInfo.currentStreak,
    bestStreak: streakInfo.bestStreak,
  };
};

export const getHistory = async (userId: string) => {
  const spins = await prisma.rouletteSpin.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return spins.map((s) => ({
    id: s.id,
    prize: s.prize,
    prizeLabel: s.prizeLabel,
    prizeValue: s.prizeValue,
    createdAt: s.createdAt.toISOString(),
  }));
};
