import prisma from '../../database/prisma';
import AppError from '../../errors/AppError';
import { addStardust } from './stardust.service';
import * as GamificationRepository from '../gamification/gamification.repository';
import { getLevelFromXp } from '@gremio-estelar/shared';

/** Helper to grant XP without circular dependencies */
const awardXpDirectly = async (userId: string, amount: number) => {
  if (amount <= 0) return;
  const user = await GamificationRepository.getUserGamificationProfile(userId);
  if (!user) return;
  await GamificationRepository.addXpToUser(userId, amount);
  const newTotal = user.xp + amount;
  const newLevel = getLevelFromXp(newTotal);
  if (newLevel > user.level) {
    await GamificationRepository.setUserLevel(userId, newLevel);
  }
};

import { PASS_TIERS, getTierForLevel, getTierProgress, isTierRevealed } from '@gremio-estelar/shared';

// Caché ligero por proceso de temporada activa y niveles del pase. Evita
// leer season.findFirst + passLevel.findMany(50) en cada request.
let activeSeasonCache: { season: any; levels: any[]; timestamp: number } | null = null;
const ACTIVE_SEASON_CACHE_TTL_MS = 60 * 1000;

export const invalidateActiveSeasonCache = () => {
  activeSeasonCache = null;
};

export const closeSeasonAndRollover = async (oldSeason: any) => {
  try {
    const userPasses = await prisma.userSeasonPass.findMany({
      where: { seasonId: oldSeason.id },
      include: { user: { select: { id: true, username: true } } },
    });

    const passLevels = await prisma.passLevel.findMany({
      where: { seasonId: oldSeason.id },
      orderBy: { level: 'asc' },
    });

    for (const up of userPasses) {
      try {
        let claimed: number[] = [];
        try {
          claimed = JSON.parse(up.claimedLevels || '[]');
        } catch {
          claimed = [];
        }

        const unclaimedLevels = passLevels.filter(
          (l) => l.level <= up.level && !claimed.includes(l.level)
        );

        let autoStardust = 0;
        let autoXp = 0;
        const newClaimed = [...claimed];

        for (const targetLevel of unclaimedLevels) {
          newClaimed.push(targetLevel.level);
          const freeReward = targetLevel.freeReward ? JSON.parse(targetLevel.freeReward) : null;
          const premiumReward = targetLevel.premiumReward ? JSON.parse(targetLevel.premiumReward) : null;

          if (freeReward) {
            if (freeReward.type === 'stardust') autoStardust += freeReward.amount;
            else if (freeReward.type === 'xp') autoXp += freeReward.amount;
            else if (freeReward.type === 'title') {
              await grantTitleToUser(up.userId, freeReward.label).catch(() => {});
            }
          }

          if (up.isPremium && premiumReward) {
            if (premiumReward.type === 'stardust') autoStardust += premiumReward.amount;
            else if (premiumReward.type === 'xp') autoXp += premiumReward.amount;
            else if (premiumReward.type === 'title') {
              await grantTitleToUser(up.userId, premiumReward.label).catch(() => {});
            }
          }
        }

        if (autoStardust > 0) {
          await addStardust(up.userId, autoStardust, `Auto-Reclamo Cierre de ${oldSeason.name}`).catch(() => {});
        }
        if (autoXp > 0) {
          await awardXpDirectly(up.userId, autoXp).catch(() => {});
        }

        // Grant Season League Commemorative Title
        let leagueTitle = '';
        if (up.level >= 50) {
          leagueTitle = `Campeón T${oldSeason.number} Diamante`;
        } else if (up.level >= 40) {
          leagueTitle = `Veterano T${oldSeason.number} Platino`;
        } else if (up.level >= 30) {
          leagueTitle = `Pionero T${oldSeason.number} Oro`;
        } else if (up.level >= 20) {
          leagueTitle = `Miembro T${oldSeason.number} Plata`;
        } else if (up.level >= 10) {
          leagueTitle = `Aventurero T${oldSeason.number} Bronce`;
        }

        if (leagueTitle) {
          await grantTitleToUser(up.userId, leagueTitle).catch(() => {});
        }

        await prisma.userSeasonPass.update({
          where: { id: up.id },
          data: { claimedLevels: JSON.stringify(newClaimed) },
        }).catch(() => {});

        const summaryMsg = autoStardust > 0 || autoXp > 0
          ? `La ${oldSeason.name} ha finalizado. Hemos auto-reclamado tus niveles pendientes (+${autoStardust} ★ Stardust, +${autoXp} XP)${leagueTitle ? ` y tu título de temporada: "${leagueTitle}"` : ''}.`
          : `La ${oldSeason.name} ha finalizado.${leagueTitle ? ` ¡Felicidades por obtener tu título de temporada: "${leagueTitle}"!` : ''}`;

        await prisma.notification.create({
          data: {
            userId: up.userId,
            type: 'SYSTEM',
            title: '✦ ¡Fin de Temporada!',
            message: summaryMsg,
          },
        }).catch(() => {});
      } catch (err) {
        console.error(`Error processing season rollover for user ${up.userId}:`, err);
      }
    }

    await prisma.season.update({
      where: { id: oldSeason.id },
      data: { active: false },
    });

    const nextNumber = (oldSeason.number || 1) + 1;
    const seasonThemes = [
      { name: `Temporada ${nextNumber}: Vía Láctea ✦`, theme: 'milkyway' },
      { name: `Temporada ${nextNumber}: Nebulosa Mística ✦`, theme: 'nebula' },
      { name: `Temporada ${nextNumber}: Eclipse Cósmico ✦`, theme: 'eclipse' },
      { name: `Temporada ${nextNumber}: Supernova Estelar ✦`, theme: 'supernova' },
      { name: `Temporada ${nextNumber}: Constelación de Cristal ✦`, theme: 'crystal' },
    ];
    const themeInfo = seasonThemes[(nextNumber - 1) % seasonThemes.length];

    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + 45 * 24 * 60 * 60 * 1000);

    const newSeason = await prisma.season.create({
      data: {
        name: themeInfo.name,
        theme: themeInfo.theme,
        number: nextNumber,
        startsAt,
        endsAt,
        active: true,
      },
    });

    await seedPassLevels(newSeason.id);
    activeSeasonCache = null;
    return newSeason;
  } catch (err) {
    console.error('Error during closeSeasonAndRollover:', err);
    activeSeasonCache = null;
    return null;
  }
};

export const getOrCreateActiveSeason = async () => {
  if (!prisma?.season?.findFirst) return null;

  if (activeSeasonCache && Date.now() - activeSeasonCache.timestamp < ACTIVE_SEASON_CACHE_TTL_MS) {
    return activeSeasonCache.season;
  }

  const now = new Date();
  let season = await prisma.season.findFirst({
    where: { active: true },
  });

  // Automatic rollover if active season has expired
  if (season && season.endsAt && new Date(season.endsAt) <= now) {
    await closeSeasonAndRollover(season);
    season = await prisma.season.findFirst({
      where: { active: true },
    });
  }

  if (!season) {
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + 45 * 24 * 60 * 60 * 1000); // 45 days (6 weeks)

    season = await prisma.season.create({
      data: {
        name: 'Temporada 1: Lluvia de Estrellas ✦',
        theme: 'stars',
        number: 1,
        startsAt,
        endsAt,
        active: true,
      },
    });

    await seedPassLevels(season.id);
  }

  const passLevels = await prisma.passLevel.findMany({
    where: { seasonId: season.id },
    orderBy: { level: 'asc' },
  });

  activeSeasonCache = { season, levels: passLevels, timestamp: Date.now() };
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
      free: { type: 'stardust', amount: stardustAmount, label: `${stardustAmount} ★ Polvo Estelar` },
      premium: { type: 'stardust', amount: premiumAmount, label: `${premiumAmount} ★ Polvo Estelar` },
    };
  } else {
    const xpAmount = baseAmount;
    const premiumStardust = Math.round(baseAmount * 2);
    return {
      free: { type: 'xp', amount: xpAmount, label: `${xpAmount} XP` },
      premium: { type: 'stardust', amount: premiumStardust, label: `${premiumStardust} ★ Polvo Estelar` },
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
  activeSeasonCache = null;
};

import { hasAnyRole, isStaffRole } from '@gremio-estelar/shared';


/**
 * Advance Season Pass progress when user earns XP anywhere in the app.
 * Each Pass level requires 150 XP (~1.1 levels per day with active play).
 * Levels 50+ enter "Prestigio Infinito" granting +50 ★ Stardust per 150 XP.
 */
export const addSeasonPassXp = async (userId: string, xpEarned: number) => {
  if (xpEarned <= 0 || !prisma?.season?.findFirst || !prisma?.userSeasonPass?.findUnique) return;
  try {
    const season = await getOrCreateActiveSeason();
    if (!season) return;

    let userPass = await prisma.userSeasonPass.findUnique({
      where: { userId_seasonId: { userId, seasonId: season.id } },
    });

    if (!userPass) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true, role: true },
      });
      const isVip = isStaffRole(user?.role) || hasAnyRole(user?.role, ['VIP_STELLAR']);
      const isPremiumUser = Boolean(isVip || (user?.plan && user.plan !== 'FREE'));
      userPass = await prisma.userSeasonPass.create({
        data: {
          userId,
          seasonId: season.id,
          level: 1,
          xp: 0,
          isPremium: isPremiumUser,
          claimedLevels: '[]',
        },
      });
    }

    const XP_PER_PASS_LEVEL = 150;
    const totalXp = (userPass.xp || 0) + xpEarned;
    const levelsGained = Math.floor(totalXp / XP_PER_PASS_LEVEL);
    const remainderXp = totalXp % XP_PER_PASS_LEVEL;

    if (levelsGained > 0) {
      if (userPass.level < 50) {
        const newLevel = Math.min(50, userPass.level + levelsGained);
        await prisma.userSeasonPass.update({
          where: { id: userPass.id },
          data: {
            level: newLevel,
            xp: remainderXp,
          },
        });
      } else {
        // Prestigio Infinito (Nivel 50 alcanzado):
        // Cada 150 XP otorga +50 ★ Polvo Estelar repetible
        const bonusStardust = levelsGained * 50;
        await addStardust(userId, bonusStardust, 'Recompensa Prestigio Pase Estelar (Nivel 50+)').catch(() => {});
        await prisma.userSeasonPass.update({
          where: { id: userPass.id },
          data: {
            xp: remainderXp,
          },
        });
      }
    } else {
      await prisma.userSeasonPass.update({
        where: { id: userPass.id },
        data: { xp: remainderXp },
      });
    }
  } catch (err) {
    console.error('Error adding season pass XP:', err);
  }
};

export const getUserSeasonPass = async (userId: string) => {
  const season = await getOrCreateActiveSeason();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, role: true, level: true },
  });

  // El Pase Premium gratis queda solo para staff real y roles VIP de pago.
  const isVip = isStaffRole(user?.role) || hasAnyRole(user?.role, ['VIP_STELLAR']);
  const isPremiumUser = Boolean(isVip || (user?.plan && user.plan !== 'FREE'));
  const userLevel = Math.max(1, user?.level || 1);

  let userPass = await prisma.userSeasonPass.findUnique({
    where: { userId_seasonId: { userId, seasonId: season.id } },
  });

  if (!userPass) {
    // Check if user previously bought the pass with Stardust
    const passPurchase = await prisma.stardustTransaction.findFirst({
      where: { userId, reason: { contains: 'Pase Estelar Premium' } },
    });

    userPass = await prisma.userSeasonPass.create({
      data: {
        userId,
        seasonId: season.id,
        level: 1,
        xp: 0,
        isPremium: !!isPremiumUser || !!passPurchase,
        claimedLevels: '[]',
      },
    });
  } else {
    // Sync premium state if plan changed or stardust transaction exists
    let targetPremium = userPass.isPremium || !!isPremiumUser;
    if (!targetPremium) {
      const passPurchase = await prisma.stardustTransaction.findFirst({
        where: { userId, reason: { contains: 'Pase Estelar Premium' } },
      });
      if (passPurchase) targetPremium = true;
    }

    if (userPass.isPremium !== targetPremium) {
      userPass = await prisma.userSeasonPass.update({
        where: { id: userPass.id },
        data: {
          isPremium: targetPremium,
        },
      });
    }
  }

  const cachedLevels = activeSeasonCache?.levels ?? [];
  const passLevels = cachedLevels.length > 0 ? cachedLevels : await prisma.passLevel.findMany({
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
      claimedLevelsRaw: userPass.claimedLevels || '[]',
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

  // Atomic compare-and-set: only one request can add an unclaimed level to the
  // JSON array. A parallel request re-claiming the same level sees count === 0
  // and is rejected, so the reward can never be double-awarded.
  const claimed = await prisma.userSeasonPass.updateMany({
    where: {
      id: userPass.id,
      NOT: { claimedLevels: { contains: `"${levelNumber}"` } },
    },
    data: { claimedLevels: JSON.stringify(Array.from(claimedSet)) },
  });
  if (claimed.count === 0) {
    throw new AppError('Ya reclamaste la recompensa de este nivel', 400);
  }

  // Award free reward
  let summary = '';
  if (targetLevel.freeReward) {
    if (targetLevel.freeReward.type === 'stardust') {
      const res = await addStardust(userId, targetLevel.freeReward.amount, `Recompensa Pase Nivel ${levelNumber}`);
      summary += `+${typeof res === 'object' ? res.stardustEarned : targetLevel.freeReward.amount} Stardust ⭐ `;
    } else if (targetLevel.freeReward.type === 'xp') {
      await awardXpDirectly(userId, targetLevel.freeReward.amount).catch(() => {});
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
      await awardXpDirectly(userId, targetLevel.premiumReward.amount).catch(() => {});
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

export const claimAllPassLevels = async (userId: string) => {
  const { userPass, levels } = await getUserSeasonPass(userId);
  const unclaimedUnlockedLevels = levels.filter(l => l.isUnlocked && !l.isClaimed);

  if (unclaimedUnlockedLevels.length === 0) {
    throw new AppError('No tienes recompensas del pase pendientes por reclamar', 400);
  }

  const claimedSet = new Set(userPass.claimedLevels);
  let totalStardust = 0;
  let totalXp = 0;
  const titlesGranted: string[] = [];

  for (const targetLevel of unclaimedUnlockedLevels) {
    claimedSet.add(targetLevel.level);

    if (targetLevel.freeReward) {
      if (targetLevel.freeReward.type === 'stardust') {
        totalStardust += targetLevel.freeReward.amount;
      } else if (targetLevel.freeReward.type === 'xp') {
        totalXp += targetLevel.freeReward.amount;
      } else if (targetLevel.freeReward.type === 'title') {
        await grantTitleToUser(userId, targetLevel.freeReward.label).catch(() => {});
        titlesGranted.push(targetLevel.freeReward.label);
      }
    }

    if (userPass.isPremium && targetLevel.premiumReward) {
      if (targetLevel.premiumReward.type === 'stardust') {
        totalStardust += targetLevel.premiumReward.amount;
      } else if (targetLevel.premiumReward.type === 'xp') {
        totalXp += targetLevel.premiumReward.amount;
      } else if (targetLevel.premiumReward.type === 'title') {
        await grantTitleToUser(userId, targetLevel.premiumReward.label).catch(() => {});
        titlesGranted.push(targetLevel.premiumReward.label);
      }
    }
  }

  // Atomic compare-and-set on the whole JSON: if another request already
  // claimed some of these levels meanwhile, the update is a no-op and we abort
  // (the caller can retry) instead of double-awarding.
  const claimed = await prisma.userSeasonPass.updateMany({
    where: { id: userPass.id, claimedLevels: userPass.claimedLevelsRaw },
    data: { claimedLevels: JSON.stringify(Array.from(claimedSet)) },
  });
  if (claimed.count === 0) {
    throw new AppError('Otra solicitud reclamó niveles del pase. Vuelve a intentarlo.', 409);
  }

  if (totalStardust > 0) {
    await addStardust(userId, totalStardust, `Recompensa Pase Estelar (Reclamar Todo - ${unclaimedUnlockedLevels.length} niveles)`);
  }
  if (totalXp > 0) {
    await awardXpDirectly(userId, totalXp).catch(() => {});
  }

  return {
    message: `¡Has reclamado ${unclaimedUnlockedLevels.length} nivel(es)! +${totalStardust} ⭐ Stardust, +${totalXp} XP`,
    claimedCount: unclaimedUnlockedLevels.length,
    claimedLevels: unclaimedUnlockedLevels.map(l => l.level),
    totalStardust,
    totalXp,
    titlesGranted,
  };
};

export const buyPremiumWithStardust = async (userId: string) => {
  const { userPass } = await getUserSeasonPass(userId);
  if (userPass.isPremium) {
    throw new AppError('Ya tienes el Pase Premium activo en esta temporada', 400);
  }

  const COST = 2500;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { stardust: true } });
  if (!user || user.stardust < COST) {
    throw new AppError(`Necesitas al menos ${COST} Stardust ⭐ para desbloquear el Pase Premium`, 400);
  }

  // Deduct Stardust
  await prisma.user.update({
    where: { id: userId },
    data: { stardust: { decrement: COST } },
  });

  await prisma.stardustTransaction.create({
    data: {
      userId,
      amount: -COST,
      reason: 'Activación de Pase Estelar Premium VIP',
    },
  });

  // Activate Premium
  await prisma.userSeasonPass.update({
    where: { id: userPass.id },
    data: { isPremium: true },
  });

  return {
    message: '¡Felicidades! Has activado el Pase Estelar Premium VIP ⭐ con Stardust',
    isPremium: true,
  };
};

export const skipPassLevelWithStardust = async (userId: string) => {
  const { userPass } = await getUserSeasonPass(userId);
  if (userPass.level >= 50) {
    throw new AppError('Ya has alcanzado el nivel máximo (50) del Pase Estelar', 400);
  }

  const COST = 150;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { stardust: true } });
  if (!user || user.stardust < COST) {
    throw new AppError(`Necesitas al menos ${COST} Stardust ⭐ para saltar de nivel`, 400);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      stardust: { decrement: COST },
      level: { increment: 1 },
    },
  });

  await prisma.stardustTransaction.create({
    data: {
      userId,
      amount: -COST,
      reason: `Salto de Nivel en Pase Estelar a Nivel ${userPass.level + 1}`,
    },
  });

  await prisma.userSeasonPass.update({
    where: { id: userPass.id },
    data: { level: userPass.level + 1 },
  });

  return {
    message: `¡Has avanzado al Nivel ${userPass.level + 1} del Pase Estelar!`,
    newLevel: userPass.level + 1,
  };
};

export const grantFrameToUser = async (userId: string, frameId: string) => {
  await prisma.user.update({
    where: { id: userId },
    data: { profileFrame: frameId },
  });
};

// Pass levels that grant a Mystery Chest (must match the frontend lootbox levels).
const MYSTERY_CHEST_LEVELS = [5, 15, 25, 35, 45];

export const openMysteryChest = async (userId: string) => {
  // Anti-farm: each Mystery Chest is earned by claiming a chest level in the
  // Stellar Pass (5/15/25/35/45). The user may open at most one chest per
  // claimed chest level in the current season, so spamming the endpoint no
  // longer prints Stardust. There is intentionally no daily cap: entitlement
  // persists until used, so legit users never lose a chest.
  const season = await getOrCreateActiveSeason();
  const userPass = await prisma.userSeasonPass.findUnique({
    where: { userId_seasonId: { userId, seasonId: season.id } },
  });

  let claimedChestLevels = 0;
  if (userPass?.claimedLevels) {
    try {
      const claimed: number[] = JSON.parse(userPass.claimedLevels);
      claimedChestLevels = MYSTERY_CHEST_LEVELS.filter(l => claimed.includes(l)).length;
    } catch {
      claimedChestLevels = 0;
    }
  }

  const chestsOpened = await prisma.stardustTransaction.count({
    where: {
      userId,
      reason: { equals: 'Cofre Estelar Misterioso' },
      createdAt: { gte: season.startsAt },
    },
  });

  if (chestsOpened >= claimedChestLevels) {
    throw new AppError('No tienes Cofres Misteriosos pendientes. Reclama un nivel de cofre en el Pase Estelar 🎁', 429);
  }

  const rand = Math.random();
  let rewardType = 'stardust';
  let stardustAmount = 300;
  let xpAmount = 0;
  let frameGranted: string | null = null;
  let label = '';

  if (rand < 0.65) {
    // Standard Stardust
    stardustAmount = Math.floor(Math.random() * 400) + 300; // 300-700
    label = `¡${stardustAmount} ⭐ Stardust Estelar!`;
  } else if (rand < 0.90) {
    // High Stardust + XP
    stardustAmount = Math.floor(Math.random() * 500) + 800; // 800-1300
    xpAmount = 350;
    label = `¡GRAN BOTÍN! +${stardustAmount} ⭐ Stardust y +${xpAmount} XP!`;
  } else {
    // Legendary reward + Frame
    stardustAmount = 1500;
    xpAmount = 600;
    const frames = ['frame-fuego', 'frame-galaxia', 'frame-esmeralda', 'frame-oro'];
    frameGranted = frames[Math.floor(Math.random() * frames.length)];
    await grantFrameToUser(userId, frameGranted).catch(() => {});
    label = `¡¡BOTÍN LEGENDARIO!! +${stardustAmount} ⭐ Stardust, +${xpAmount} XP y Marco de Avatar "${frameGranted}"!`;
  }

  if (stardustAmount > 0) {
    await addStardust(userId, stardustAmount, 'Cofre Estelar Misterioso');
  }
  if (xpAmount > 0) {
    await awardXpDirectly(userId, xpAmount).catch(() => {});
  }

  return {
    message: label,
    stardustAmount,
    xpAmount,
    frameGranted,
  };
};


