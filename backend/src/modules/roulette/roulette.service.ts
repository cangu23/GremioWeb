import AppError from '../../errors/AppError';
import prisma from '../../database/prisma';
import * as GamificationRepository from '../gamification/gamification.repository';
import { addStardust, spendStardust, getStardustBalance } from '../ecosystem/stardust.service';

// ── Enhanced Prize Pool (Includes Mystic Chests & Epic Rewards) ──
// Balanced so the expected Stardust value per spin stays well BELOW the
// EXTRA_SPIN cost (50). Previously the pool paid out ~105 ⭐ per 50 ⭐ spin
// (and ~210 ⭐ with the ×2 plan multiplier), which let bots farm Stardust
// infinitely via /roulette/spin-stardust. Current EV ≈ 24 ⭐ < 50 even at ×2.
const PRIZES = [
  { id: 'xp_50', label: '50 XP', value: 50, stardust: 3, weight: 24, color: '#8B5CF6', type: 'XP' },
  { id: 'stardust_25', label: '⭐ 15 Stardust', value: 15, stardust: 15, weight: 20, color: '#F59E0B', type: 'STARDUST' },
  { id: 'xp_200', label: '200 XP', value: 200, stardust: 10, weight: 15, color: '#7C3AED', type: 'XP' },
  { id: 'chest_bronze', label: '🥉 Cofre Bronce', value: 150, stardust: 15, weight: 12, color: '#CD7F32', type: 'CHEST', chestType: 'BRONZE' },
  { id: 'stardust_100', label: '⭐ 35 Stardust', value: 35, stardust: 35, weight: 10, color: '#3B82F6', type: 'STARDUST' },
  { id: 'chest_silver', label: '🥈 Cofre Plata', value: 400, stardust: 25, weight: 8, color: '#C0C0C0', type: 'CHEST', chestType: 'SILVER' },
  { id: 'xp_1000', label: '1,000 XP', value: 1000, stardust: 30, weight: 5, color: '#EC4899', type: 'XP' },
  { id: 'chest_gold', label: '🥇 Cofre Oro', value: 1200, stardust: 50, weight: 3, color: '#FFD700', type: 'CHEST', chestType: 'GOLD' },
  { id: 'badge_lucky', label: '🍀 Insignia Mítica', value: 500, stardust: 60, weight: 2, color: '#10B981', type: 'BADGE' },
  { id: 'chest_cosmic', label: '🌌 Cofre Cósmico', value: 5000, stardust: 100, weight: 1, color: '#9333EA', type: 'CHEST', chestType: 'COSMIC' },
];

const TOTAL_WEIGHT = PRIZES.reduce((sum, p) => sum + p.weight, 0);
export const EXTRA_SPIN_STARDUST_COST = 50;
export const MAX_PAID_SPINS_PER_DAY = 5;

function pickPrize() {
  const rand = Math.random() * TOTAL_WEIGHT;
  let cumulative = 0;
  for (const prize of PRIZES) {
    cumulative += prize.weight;
    if (rand <= cumulative) return prize;
  }
  return PRIZES[0];
}

// ── Mystic Chest Contents Generator ──
async function processChestReward(userId: string, chestType: string) {
  let bonusXp = 0;
  let bonusStardust = 0;
  let itemsWon: string[] = [];

  if (chestType === 'BRONZE') {
    bonusXp = Math.floor(Math.random() * 100) + 50;
    bonusStardust = Math.floor(Math.random() * 15) + 5;
    itemsWon.push('📦 Ficha Extra');
  } else if (chestType === 'SILVER') {
    bonusXp = Math.floor(Math.random() * 200) + 100;
    bonusStardust = Math.floor(Math.random() * 25) + 15;
    itemsWon.push('⚡ Multiplicador 2x');
  } else if (chestType === 'GOLD') {
    bonusXp = Math.floor(Math.random() * 400) + 200;
    bonusStardust = Math.floor(Math.random() * 35) + 25;
    itemsWon.push('👑 Título Dorado');
  } else if (chestType === 'COSMIC') {
    bonusXp = Math.floor(Math.random() * 1200) + 800;
    bonusStardust = Math.floor(Math.random() * 100) + 50;
    itemsWon.push('🌌 Insignia Estelar Leyenda');
  }

  return { bonusXp, bonusStardust, itemsWon };
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

  const dates = Array.from(
    new Set(spins.map((s) => s.createdAt.toISOString().split('T')[0]))
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  let currentStreak = 0;

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

  // Evolving Tier Level based on streak and total spins
  const rouletteTier = streakInfo.currentStreak >= 7 ? 3 : streakInfo.currentStreak >= 3 ? 2 : 1;
  const tierName = rouletteTier === 3 ? 'Cósmico' : rouletteTier === 2 ? 'Épico' : 'Estándar';

  return {
    canSpin,
    nextSpinAt: lastSpin ? new Date(lastSpin.createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString() : null,
    prizes: PRIZES,
    currentStreak: streakInfo.currentStreak,
    bestStreak: streakInfo.bestStreak,
    streakBonusPercent,
    stardustCostForExtraSpin: EXTRA_SPIN_STARDUST_COST,
    userStardust: stardustInfo.stardust,
    rouletteTier,
    tierName,
  };
};

export const spin = async (userId: string) => {
  const status = await getStatus(userId);
  if (!status.canSpin) {
    throw new AppError('Ya giraste la ruleta hoy. Vuelve en 24h o gira con Polvo Estelar.', 429);
  }

  const prize = pickPrize();
  const streakBonusPercent = status.streakBonusPercent || 0;
  
  let finalXp = prize.value > 0 ? Math.round(prize.value * (1 + streakBonusPercent / 100)) : 0;
  let finalStardust = prize.stardust || 0;
  let chestDetails = null;

  if (prize.type === 'CHEST' && prize.chestType) {
    chestDetails = await processChestReward(userId, prize.chestType);
    finalXp += chestDetails.bonusXp;
    finalStardust += chestDetails.bonusStardust;
  }

  // Award XP & Stardust
  if (finalXp > 0) {
    await GamificationRepository.addXpToUser(userId, finalXp);
  }
  if (finalStardust > 0) {
    await addStardust(userId, finalStardust, `Ruleta: ${prize.label}`).catch(() => {});
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

  let message = `¡Ganaste ${prize.label}! (+${finalXp} XP, ⭐ ${finalStardust} Stardust)`;
  if (chestDetails && chestDetails.itemsWon.length > 0) {
    message = `¡Abriste ${prize.label}! Ganaste +${finalXp} XP, ⭐ ${finalStardust} Stardust y ${chestDetails.itemsWon.join(', ')}`;
  }

  return {
    prize,
    rotation,
    finalXp,
    finalStardust,
    chestDetails,
    streakBonusPercent,
    message,
  };
};

export const spinWithStardust = async (userId: string) => {
  // Anti-farm: cap paid spins per day (UTC). spendStardust records a
  // StardustTransaction with reason 'Giro extra de Ruleta', which we count.
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const paidSpinsToday = await prisma.stardustTransaction.count({
    where: {
      userId,
      reason: 'Giro extra de Ruleta',
      createdAt: { gte: startOfDay },
    },
  });
  if (paidSpinsToday >= MAX_PAID_SPINS_PER_DAY) {
    throw new AppError(`Límite diario de ${MAX_PAID_SPINS_PER_DAY} giros pagados alcanzado. Vuelve mañana.`, 429);
  }

  await spendStardust(userId, EXTRA_SPIN_STARDUST_COST, 'Giro extra de Ruleta');

  const prize = pickPrize();
  const streakInfo = await calculateStreak(userId);
  const streakBonusPercent = Math.min(50, Math.max(0, (streakInfo.currentStreak - 1) * 5));
  
  let finalXp = prize.value > 0 ? Math.round(prize.value * (1 + streakBonusPercent / 100)) : 0;
  let finalStardust = prize.stardust || 0;
  let chestDetails = null;

  if (prize.type === 'CHEST' && prize.chestType) {
    chestDetails = await processChestReward(userId, prize.chestType);
    finalXp += chestDetails.bonusXp;
    finalStardust += chestDetails.bonusStardust;
  }

  if (finalXp > 0) {
    await GamificationRepository.addXpToUser(userId, finalXp);
  }
  if (finalStardust > 0) {
    await addStardust(userId, finalStardust, `Ruleta (Extra): ${prize.label}`).catch(() => {});
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

  let message = `¡Ganaste ${prize.label}! (+${finalXp} XP, ⭐ ${finalStardust} Stardust)`;
  if (chestDetails && chestDetails.itemsWon.length > 0) {
    message = `¡Abriste ${prize.label}! Ganaste +${finalXp} XP, ⭐ ${finalStardust} Stardust y ${chestDetails.itemsWon.join(', ')}`;
  }

  return {
    prize,
    rotation,
    finalXp,
    finalStardust,
    chestDetails,
    streakBonusPercent,
    message,
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
