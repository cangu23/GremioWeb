import AppError from '../../errors/AppError';
import prisma from '../../database/prisma';
import * as GamificationRepository from '../gamification/gamification.repository';
import { addStardust } from '../ecosystem/stardust.service';

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

function pickPrize() {
  const rand = Math.random() * TOTAL_WEIGHT;
  let cumulative = 0;
  for (const prize of PRIZES) {
    cumulative += prize.weight;
    if (rand <= cumulative) return prize;
  }
  return PRIZES[0];
}

export const getStatus = async (userId: string) => {
  const lastSpin = await prisma.rouletteSpin.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const now = Date.now();
  const canSpin = !lastSpin || (now - lastSpin.createdAt.getTime() >= 24 * 60 * 60 * 1000);

  return {
    canSpin,
    nextSpinAt: lastSpin ? new Date(lastSpin.createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString() : null,
    prizes: PRIZES,
  };
};

export const spin = async (userId: string) => {
  const status = await getStatus(userId);
  if (!status.canSpin) {
    throw new AppError('Ya giraste la ruleta hoy. Vuelve en 24h.', 429);
  }

  const prize = pickPrize();

  // Award XP and Stardust if the prize is XP
  if (prize.value > 0) {
    await GamificationRepository.addXpToUser(userId, prize.value);
    await addStardust(userId, Math.round(prize.value / 2), `Ruleta: ${prize.label}`).catch(() => {});
  }

  // Record spin
  await prisma.rouletteSpin.create({
    data: {
      userId,
      prize: prize.id,
      prizeLabel: prize.label,
      prizeValue: prize.value,
    },
  });

  // Calculate random rotation for animation (between 720 and 1440 degrees for multiple spins)
  const prizeIndex = PRIZES.findIndex(p => p.id === prize.id);
  const segmentAngle = 360 / PRIZES.length;
  const targetAngle = segmentAngle * prizeIndex;
  const randomOffset = Math.random() * segmentAngle * 0.8; // Within the segment
  const rotation = 720 + (360 - targetAngle - randomOffset); // Full spins + landing position

  return {
    prize,
    rotation,
    message: prize.value > 0
      ? `¡Ganaste ${prize.label}!`
      : prize.id === 'nothing'
        ? 'No ganaste nada esta vez. ¡Intenta mañana!'
        : `¡Ganaste ${prize.label}!`,
  };
};

export const getHistory = async (userId: string) => {
  const spins = await prisma.rouletteSpin.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return spins.map(s => ({
    id: s.id,
    prize: s.prize,
    prizeLabel: s.prizeLabel,
    prizeValue: s.prizeValue,
    createdAt: s.createdAt.toISOString(),
  }));
};
