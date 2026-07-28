import prisma from '../../database/prisma';
import AppError from '../../errors/AppError';
import { addStardust } from './stardust.service';
import { awardCustomXp } from '../gamification/gamification.service';
import { PASS_TIERS, getTierForLevel, getTierProgress, isTierRevealed } from '@gremio-estelar/shared';

export const getOrCreateActiveSeason = async () => {
  let season = await prisma.season.findFirst({
    where: { active: true },
  });

  if (!season) {
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setMonth(endsAt.getMonth() + 2); // 2-month season

    season = await prisma.season.create({
      data: {
        name: 'Temporada 1: Lluvia de Estrellas ⭐',
        theme: 'stars',
        number: 1,
        startsAt,
        endsAt,
        active: true,
      },
    });

    await seedPassLevels(season.id);
  }

  return season;
};

/** Generate rewards for a given pass level programmatically */
function generateRewardForLevel(level: number): {
  free: { type: string; amount: number; label: string };
  premium: { type: string; amount: number; label: string };
} {
  const tierIndex = Math.floor((level - 1) / 10); // 0=Bronce, 1=Plata, 2=Oro, 3=Platino, 4=Diamante
  const posInTier = ((level - 1) % 10) + 1; // 1-10 within tier
  const multiplier = Math.pow(1.6, tierIndex); // Each tier rewards 60% more

  const tierNames = ['Bronce', 'Plata', 'Oro', 'Platino', 'Diamante'];

  // Tier completion rewards (every 10th level)
  if (posInTier === 10) {
    const titles = ['Viajero', 'Explorador', 'Maestro', 'Leyenda', 'Supremo'];
    const premiumTitles = ['Coleccionista', 'Estratega', 'Virtuoso', 'Inmortal', 'Dios Estelar'];
    const stardustAmount = Math.round(800 * multiplier);
    return {
      free: { type: 'title', amount: 1, label: `Título: ${tierNames[tierIndex]} ${titles[tierIndex]}` },
      premium: {
        type: 'title',
        amount: 1,
        label: `Título: ${premiumTitles[tierIndex]} Estelar`,
      },
    };
  }

  // Regular levels: alternate between stardust and XP
  const isStardustLevel = posInTier % 2 === 1;
  const baseAmount = Math.round(40 * multiplier * (1 + posInTier * 0.25));

  if (isStardustLevel) {
    const stardustAmount = baseAmount;
    const premiumAmount = Math.round(baseAmount * 3);
    return {
      free: { type: 'stardust', amount: stardustAmount, label: `${stardustAmount} Stardust ⭐` },
      premium: { type: 'stardust', amount: premiumAmount, label: `${premiumAmount} Stardust ⭐` },
    };
  } else {
    const xpAmount = baseAmount;
    const premiumStardust = Math.round(baseAmount * 2);
    return {
      free: { type: 'xp', amount: xpAmount, label: `${xpAmount} XP` },
      premium: { type: 'stardust', amount: premiumStardust, label: `${premiumStardust} Stardust ⭐` },
    };
  }
}

export const seedPassLevels = async (seasonId: string) => {
  for (let level = 1; level <= 50; level++) {
    const existing = await prisma.passLevel.findUnique({
      where: { seasonId_level: { seasonId, level } },
    });
    if (!existing) {
      const reward = generateRewardForLevel(level);
      await prisma.passLevel.create({
        data: {
          seasonId,
          level,
          freeReward: JSON.stringify(reward.free),
          premiumReward: JSON.stringify(reward.premium),
        },
      });
    }
  }
};

export const getUserSeasonPass = async (userId: string) => {
  const season = await getOrCreateActiveSeason();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, role: true, level: true },
  });

  const isVip = user?.role === 'VTUBER' || user?.role === 'MAID' || user?.role === 'ADMIN';
  const isPremiumUser = isVip || (user?.plan && user.plan !== 'FREE');
  const userLevel = Math.max(1, user?.level || 1);

  let userPass = await prisma.userSeasonPass.findUnique({
    where: { userId_seasonId: { userId, seasonId: season.id } },
  });

  if (!userPass) {
    userPass = await prisma.userSeasonPass.create({
      data: {
        userId,
        seasonId: season.id,
        level: userLevel,
        xp: 0,
        isPremium: !!isPremiumUser,
        claimedLevels: '[]',
      },
    });
  } else {
    const updatedLevel = Math.max(userPass.level, userLevel);
    if (userPass.level !== updatedLevel || userPass.isPremium !== !!isPremiumUser) {
      userPass = await prisma.userSeasonPass.update({
        where: { id: userPass.id },
        data: {
          level: updatedLevel,
          isPremium: !!isPremiumUser,
        },
      });
    }
  }

  const passLevels = await prisma.passLevel.findMany({
    where: { seasonId: season.id },
    orderBy: { level: 'asc' },
  });

  let claimed: number[] = [];
  try {
    claimed = JSON.parse(userPass.claimedLevels || '[]');
  } catch {
    claimed = [];
  }

  return {
    season,
    userPass: {
      ...userPass,
      claimedLevels: claimed,
    },
    tiers: PASS_TIERS.map(tier => ({
      ...tier,
      isRevealed: isTierRevealed(tier, userPass!.level),
      levels: passLevels
        .filter(l => l.level >= tier.minLevel && l.level <= tier.maxLevel)
        .map(l => ({
          level: l.level,
          freeReward: l.freeReward ? JSON.parse(l.freeReward) : null,
          premiumReward: l.premiumReward ? JSON.parse(l.premiumReward) : null,
          isClaimed: claimed.includes(l.level),
          isUnlocked: userPass!.level >= l.level,
        })),
    })),
    levels: passLevels.map(l => ({
      level: l.level,
      freeReward: l.freeReward ? JSON.parse(l.freeReward) : null,
      premiumReward: l.premiumReward ? JSON.parse(l.premiumReward) : null,
      isClaimed: claimed.includes(l.level),
      isUnlocked: userPass!.level >= l.level,
    })),
    currentTier: getTierForLevel(userPass!.level),
    tierProgress: getTierProgress(userPass!.level),
  };
};

/**
 * Helper to grant a title to user if they don't already have it
 */
const grantTitleToUser = async (userId: string, titleLabel: string) => {
  const cleanName = titleLabel.replace(/^(Título:\s*)/i, '').trim();
  let title = await prisma.title.findUnique({ where: { name: cleanName } });
  if (!title) {
    title = await prisma.title.create({
      data: {
        name: cleanName,
        description: `Título obtenido en el Pase Estelar`,
        requirementType: 'SEASONAL',
      },
    });
  }
  const existingUserTitle = await prisma.userTitle.findUnique({
    where: { userId_titleId: { userId, titleId: title.id } },
  });
  if (!existingUserTitle) {
    await prisma.userTitle.create({
      data: { userId, titleId: title.id },
    });
  }
};

export const claimPassLevel = async (userId: string, levelNumber: number) => {
  const { userPass, levels } = await getUserSeasonPass(userId);
  const targetLevel = levels.find(l => l.level === levelNumber);

  if (!targetLevel) throw new AppError('Nivel del pase no encontrado', 404);
  if (!targetLevel.isUnlocked) throw new AppError('Aún no has desbloqueado este nivel del pase', 400);

  if (targetLevel.isClaimed) {
    throw new AppError('Ya reclamaste la recompensa de este nivel', 400);
  }

  const claimedSet = new Set(userPass.claimedLevels);
  claimedSet.add(levelNumber);

  await prisma.userSeasonPass.update({
    where: { id: userPass.id },
    data: { claimedLevels: JSON.stringify(Array.from(claimedSet)) },
  });

  // Award free reward
  let summary = '';
  if (targetLevel.freeReward) {
    if (targetLevel.freeReward.type === 'stardust') {
      const res = await addStardust(userId, targetLevel.freeReward.amount, `Recompensa Pase Nivel ${levelNumber}`);
      summary += `+${typeof res === 'object' ? res.stardustEarned : targetLevel.freeReward.amount} Stardust ⭐ `;
    } else if (targetLevel.freeReward.type === 'xp') {
      await awardCustomXp(userId, targetLevel.freeReward.amount).catch(() => {});
      summary += `+${targetLevel.freeReward.amount} XP `;
    } else if (targetLevel.freeReward.type === 'title') {
      await grantTitleToUser(userId, targetLevel.freeReward.label).catch(() => {});
      summary += `Título desbloqueado: "${targetLevel.freeReward.label}" `;
    }
  }

  // Award premium reward if user is premium
  if (userPass.isPremium && targetLevel.premiumReward) {
    if (targetLevel.premiumReward.type === 'stardust') {
      const res = await addStardust(userId, targetLevel.premiumReward.amount, `Recompensa Premium Pase Nivel ${levelNumber}`);
      summary += `+${typeof res === 'object' ? res.stardustEarned : targetLevel.premiumReward.amount} Stardust (Premium) ⭐ `;
    } else if (targetLevel.premiumReward.type === 'xp') {
      await awardCustomXp(userId, targetLevel.premiumReward.amount).catch(() => {});
      summary += `+${targetLevel.premiumReward.amount} XP (Premium) `;
    } else if (targetLevel.premiumReward.type === 'title') {
      await grantTitleToUser(userId, targetLevel.premiumReward.label).catch(() => {});
      summary += `Título Premium desbloqueado: "${targetLevel.premiumReward.label}" `;
    }
  }

  return {
    message: `¡Recompensa Nivel ${levelNumber} reclamada! ${summary.trim()}`,
    claimedLevel: levelNumber,
  };
};
