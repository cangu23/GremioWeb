import prisma from '../../database/prisma';
import AppError from '../../errors/AppError';
import { addStardust } from './stardust.service';
import { awardCustomXp } from '../gamification/gamification.service';

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

export const seedPassLevels = async (seasonId: string) => {
  const rewards = [
    { level: 1, free: { type: 'stardust', amount: 50, label: '50 Stardust ⭐' }, premium: { type: 'stardust', amount: 150, label: '150 Stardust ⭐' } },
    { level: 2, free: { type: 'xp', amount: 100, label: '100 XP' }, premium: { type: 'xp', amount: 300, label: '300 XP' } },
    { level: 3, free: { type: 'stardust', amount: 75, label: '75 Stardust ⭐' }, premium: { type: 'title', amount: 1, label: 'Título: ⭐ Viajero Estelar' } },
    { level: 4, free: { type: 'xp', amount: 150, label: '150 XP' }, premium: { type: 'stardust', amount: 250, label: '250 Stardust ⭐' } },
    { level: 5, free: { type: 'stardust', amount: 100, label: '100 Stardust ⭐' }, premium: { type: 'title', amount: 1, label: 'Título: ✨ Astro Pro' } },
    { level: 6, free: { type: 'xp', amount: 200, label: '200 XP' }, premium: { type: 'stardust', amount: 350, label: '350 Stardust ⭐' } },
    { level: 7, free: { type: 'stardust', amount: 120, label: '120 Stardust ⭐' }, premium: { type: 'xp', amount: 500, label: '500 XP' } },
    { level: 8, free: { type: 'xp', amount: 250, label: '250 XP' }, premium: { type: 'stardust', amount: 400, label: '400 Stardust ⭐' } },
    { level: 9, free: { type: 'stardust', amount: 150, label: '150 Stardust ⭐' }, premium: { type: 'xp', amount: 600, label: '600 XP' } },
    { level: 10, free: { type: 'title', amount: 1, label: 'Título: 🌸 Guardián Estelar' }, premium: { type: 'title', amount: 1, label: 'Título: 🌟 Leyenda Neón' } },
  ];

  for (const r of rewards) {
    const existing = await prisma.passLevel.findUnique({
      where: { seasonId_level: { seasonId, level: r.level } },
    });

    if (!existing) {
      await prisma.passLevel.create({
        data: {
          seasonId,
          level: r.level,
          freeReward: JSON.stringify(r.free),
          premiumReward: JSON.stringify(r.premium),
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
    levels: passLevels.map(l => ({
      level: l.level,
      freeReward: l.freeReward ? JSON.parse(l.freeReward) : null,
      premiumReward: l.premiumReward ? JSON.parse(l.premiumReward) : null,
      isClaimed: claimed.includes(l.level),
      isUnlocked: userPass!.level >= l.level,
    })),
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
