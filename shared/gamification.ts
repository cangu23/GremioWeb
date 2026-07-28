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

// ──────────────────────────────
// Pass Tier system (Duolingo-style divisions)
// ──────────────────────────────

export interface PassTier {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string;
  glowColor: string;
  minLevel: number;
  maxLevel: number;
}

export const PASS_TIERS: PassTier[] = [
  {
    id: 'bronze',
    name: 'Bronce',
    icon: '🪙',
    color: '#CD7F32',
    gradient: 'linear-gradient(135deg, #CD7F32, #A0652A)',
    glowColor: 'rgba(205, 127, 50, 0.4)',
    minLevel: 1,
    maxLevel: 2,
  },
  {
    id: 'silver',
    name: 'Plata',
    icon: '🥈',
    color: '#C0C0C0',
    gradient: 'linear-gradient(135deg, #E8E8E8, #A0A0A0)',
    glowColor: 'rgba(192, 192, 192, 0.4)',
    minLevel: 3,
    maxLevel: 4,
  },
  {
    id: 'gold',
    name: 'Oro',
    icon: '🥇',
    color: '#FFD700',
    gradient: 'linear-gradient(135deg, #FFD700, #FF8C00)',
    glowColor: 'rgba(255, 215, 0, 0.4)',
    minLevel: 5,
    maxLevel: 6,
  },
  {
    id: 'platinum',
    name: 'Platino',
    icon: '💎',
    color: '#00E5FF',
    gradient: 'linear-gradient(135deg, #00E5FF, #0099CC)',
    glowColor: 'rgba(0, 229, 255, 0.4)',
    minLevel: 7,
    maxLevel: 8,
  },
  {
    id: 'diamond',
    name: 'Diamante',
    icon: '🔮',
    color: '#B026FF',
    gradient: 'linear-gradient(135deg, #B026FF, #6B21A8)',
    glowColor: 'rgba(176, 38, 255, 0.4)',
    minLevel: 9,
    maxLevel: 10,
  },
];

export function getTierForLevel(level: number): PassTier {
  for (let i = PASS_TIERS.length - 1; i >= 0; i--) {
    if (level >= PASS_TIERS[i].minLevel) return PASS_TIERS[i];
  }
  return PASS_TIERS[0];
}

export function getTierProgress(level: number): { currentTier: PassTier; nextTier: PassTier | null; progress: number } {
  const current = getTierForLevel(level);
  const nextIndex = PASS_TIERS.findIndex(t => t.id === current.id) + 1;
  const next = nextIndex < PASS_TIERS.length ? PASS_TIERS[nextIndex] : null;
  
  const levelsInCurrent = current.maxLevel - current.minLevel + 1;
  const progressInTier = Math.max(0, level - current.minLevel + 1);
  const progress = Math.min(100, Math.round((progressInTier / levelsInCurrent) * 100));
  
  return { currentTier: current, nextTier: next, progress };
}

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
