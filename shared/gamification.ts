// XP thresholds for each level
export const LEVEL_XP_THRESHOLDS: number[] = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  800,    // Level 5
  1200,   // Level 6
  1700,   // Level 7
  2300,   // Level 8
  3000,   // Level 9
  4000,   // Level 10
  5200,   // Level 11
  6600,   // Level 12
  8200,   // Level 13
  10000,  // Level 14
  12000,  // Level 15
];

export const MAX_LEVEL = LEVEL_XP_THRESHOLDS.length;

export function getLevelFromXp(xp: number): number {
  for (let i = LEVEL_XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getXpForNextLevel(level: number): number {
  const idx = Math.min(level, LEVEL_XP_THRESHOLDS.length - 1);
  return LEVEL_XP_THRESHOLDS[idx];
}

export function getXpProgress(currentXp: number, currentLevel: number): { current: number; needed: number; percentage: number } {
  const currentThreshold = LEVEL_XP_THRESHOLDS[Math.min(currentLevel - 1, LEVEL_XP_THRESHOLDS.length - 1)];
  const nextThreshold = LEVEL_XP_THRESHOLDS[Math.min(currentLevel, LEVEL_XP_THRESHOLDS.length - 1)];
  const progress = currentXp - currentThreshold;
  const needed = nextThreshold - currentThreshold;
  return {
    current: progress,
    needed,
    percentage: needed > 0 ? Math.min(100, Math.round((progress / needed) * 100)) : 100,
  };
}

// XP rewards for different actions
export const XP_REWARDS = {
  CREATE_EVENT: 50,
  ATTEND_EVENT: 25,
  CREATE_GUILD: 75,
  FOLLOW_USER: 5,
  GET_FOLLOWER: 10,
  JOIN_GUILD: 15,
  LOGIN_STREAK: 20,
  WATCH_STREAM: 20,
} as const;

export interface AchievementData {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  xpReward: number;
  category: string;
  createdAt: string;
}

export interface UserAchievementData {
  id: string;
  userId: string;
  achievementId: string;
  earnedAt: string;
  achievement: AchievementData;
}

export interface GamificationProfile {
  xp: number;
  level: number;
  xpProgress: { current: number; needed: number; percentage: number };
  achievements: UserAchievementData[];
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  xp: number;
  level: number;
  avatarUrl: string | null;
  displayName: string | null;
  rank: number;
}

export interface XpAwardResult {
  xpAwarded: number;
  totalXp: number;
  level: number;
  levelUp: boolean;
  newAchievements: AchievementData[];
}
