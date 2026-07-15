import AppError from '../../errors/AppError';
import { getLevelFromXp, XP_REWARDS } from '@gremio-estelar/shared';
import * as GamificationRepository from './gamification.repository';
import * as NotificationsService from '../notifications/notifications.service';

export const getMyGamificationProfile = async (userId: string) => {
  const profile = await GamificationRepository.getUserGamificationProfile(userId);
  if (!profile) throw new AppError('Usuario no encontrado', 404);

  const achievements = await GamificationRepository.findUserAchievements(userId);

  const xpProgress = {
    current: profile.xp,
    level: profile.level,
  };

  return {
    ...profile,
    achievements,
    xpProgress,
  };
};

export const getLeaderboard = async (limit = 50) => {
  const users = await GamificationRepository.getLeaderboard(limit);
  return users.map((u: { id: string; username: string; xp: number; level: number; vtuberProfile: { displayName: string | null; avatarUrl: string | null } | null }, i: number) => ({
    id: u.id,
    username: u.username,
    xp: u.xp,
    level: u.level,
    avatarUrl: u.vtuberProfile?.avatarUrl ?? null,
    displayName: u.vtuberProfile?.displayName ?? null,
    rank: i + 1,
  }));
};

export const getAllAchievements = async () => {
  const achievements = await GamificationRepository.findAllAchievements();
  return achievements;
};

export const awardXpForAction = async (userId: string, action: keyof typeof XP_REWARDS) => {
  const xpAmount = XP_REWARDS[action];
  if (!xpAmount) throw new AppError(`Acción '${action}' no tiene XP configurado`, 400);
  return awardXpBase(userId, xpAmount);
};

/**
 * Award a custom amount of XP (not tied to a specific action)
 */
export const awardCustomXp = async (userId: string, amount: number) => {
  if (amount <= 0) throw new AppError('La cantidad de XP debe ser positiva', 400);
  return awardXpBase(userId, amount);
};

async function awardXpBase(userId: string, xpAmount: number) {
  const user = await GamificationRepository.getUserGamificationProfile(userId);
  if (!user) throw new AppError('Usuario no encontrado', 404);

  await GamificationRepository.addXpToUser(userId, xpAmount);

  const newTotal = user.xp + xpAmount;
  const newLevel = getLevelFromXp(newTotal);

  let levelUp = false;
  if (newLevel > user.level) {
    await GamificationRepository.setUserLevel(userId, newLevel);
    levelUp = true;
    await NotificationsService.notifyLevelUp(newLevel, userId).catch(() => {});
  }

  // Check for achievements that might have been unlocked
  const newAchievements: Array<{ id: string; name: string; description: string; xpReward: number; category: string; iconUrl?: string | null; createdAt: Date | string }> = [];
  const achievements = await GamificationRepository.findAllAchievements();
  const userAchievements = await GamificationRepository.findUserAchievements(userId);
  const userAchievementIds = userAchievements.map((ua: { achievementId: string }) => ua.achievementId);

  for (const achievement of achievements) {
    if (userAchievementIds.includes(achievement.id)) continue;

    // Check if the achievement criteria are met
    const unlocked = await checkAchievementCriteria(userId, achievement, newTotal, newLevel);
    if (unlocked) {
      const awarded = await GamificationRepository.awardAchievementToUser(userId, achievement.id);
      newAchievements.push(awarded.achievement);
      await NotificationsService.notifyAchievement(achievement.name, userId, achievement.id).catch(() => {});

      // Also award the XP from the achievement
      if (achievement.xpReward > 0) {
        await GamificationRepository.addXpToUser(userId, achievement.xpReward);
        // Check level again
        const afterAchievementXp = newTotal + achievement.xpReward;
        const afterLevel = getLevelFromXp(afterAchievementXp);
        if (afterLevel > newLevel) {
          await GamificationRepository.setUserLevel(userId, afterLevel);
        }
      }
    }
  }

  return {
    xpAwarded: xpAmount,
    totalXp: newTotal,
    level: newLevel,
    levelUp,
    newAchievements,
  };
}

// Check various achievement criteria
async function checkAchievementCriteria(
  userId: string,
  achievement: AchievementWithCriteria,
  currentXp: number,
  currentLevel: number
): Promise<boolean> {
  const name = achievement.name.toLowerCase();

  // Level-based achievements
  if (name.includes('nivel 5') || name.includes('level 5')) return currentLevel >= 5;
  if (name.includes('nivel 10') || name.includes('level 10')) return currentLevel >= 10;

  // XP-based achievements
  if (name.includes('100 xp') || name.includes('100xp')) return currentXp >= 100;
  if (name.includes('500 xp') || name.includes('500xp')) return currentXp >= 500;
  if (name.includes('1000 xp') || name.includes('1000xp')) return currentXp >= 1000;

  // First steps
  if (name.includes('primeros pasos') || name.includes('first steps')) return true; // Awarded on first action

  return false;
}

// Seed default achievements
export const seedAchievements = async () => {
  const defaults = [
    { name: 'Primeros Pasos', description: 'Realiza tu primera acción en la plataforma', xpReward: 10, category: 'GENERAL' },
    { name: '100 XP', description: 'Acumula 100 puntos de experiencia', xpReward: 20, category: 'XP' },
    { name: '500 XP', description: 'Acumula 500 puntos de experiencia', xpReward: 50, category: 'XP' },
    { name: '1000 XP', description: 'Acumula 1000 puntos de experiencia', xpReward: 100, category: 'XP' },
    { name: 'Nivel 5', description: 'Alcanza el nivel 5', xpReward: 50, category: 'NIVEL' },
    { name: 'Nivel 10', description: 'Alcanza el nivel 10', xpReward: 100, category: 'NIVEL' },
    { name: 'Creador de Eventos', description: 'Crea tu primer evento', xpReward: 30, category: 'EVENTOS' },
    { name: 'Asistente Estelar', description: 'Asiste a tu primer evento', xpReward: 15, category: 'EVENTOS' },
    { name: 'Fundador de Gremio', description: 'Crea tu primer gremio', xpReward: 40, category: 'GREMIOS' },
    { name: 'Socialble', description: 'Consigue tu primer seguidor', xpReward: 20, category: 'SOCIAL' },
  ];

  for (const ach of defaults) {
    const existing = await GamificationRepository.findAchievementByName(ach.name);
    if (!existing) {
      await GamificationRepository.createAchievement(ach);
    }
  }
};

interface AchievementWithCriteria {
  id: string;
  name: string;
  description: string;
  xpReward: number;
  category: string;
}
