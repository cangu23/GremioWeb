// Total XP needed to reach level n: 50 * n * (n-1)
// This gives a quadratic curve: easy early, progressively harder
// Level 15 ~= 10,500 XP (close to old 12,000)
// Level 30 ~= 43,500 XP
// Level 50 ~= 122,500 XP

export const LEVEL_XP_THRESHOLDS: number[] = [
  0,        // Level 1
  100,      // Level 2
  300,      // Level 3
  600,      // Level 4
  1000,     // Level 5
  1500,     // Level 6
  2100,     // Level 7
  2800,     // Level 8
  3600,     // Level 9
  4500,     // Level 10 — Bronce
  5500,     // Level 11
  6600,     // Level 12
  7800,     // Level 13
  9100,     // Level 14
  10500,    // Level 15
  12000,    // Level 16
  13600,    // Level 17
  15300,    // Level 18
  17100,    // Level 19
  19000,    // Level 20 — Plata
  21000,    // Level 21
  23100,    // Level 22
  25300,    // Level 23
  27600,    // Level 24
  30000,    // Level 25
  32500,    // Level 26
  35100,    // Level 27
  37800,    // Level 28
  40600,    // Level 29
  43500,    // Level 30 — Oro
  46500,    // Level 31
  49600,    // Level 32
  52800,    // Level 33
  56100,    // Level 34
  59500,    // Level 35
  63000,    // Level 36
  66600,    // Level 37
  70300,    // Level 38
  74100,    // Level 39
  78000,    // Level 40 — Platino
  82000,    // Level 41
  86100,    // Level 42
  90300,    // Level 43
  94600,    // Level 44
  99000,    // Level 45
  103500,   // Level 46
  108100,   // Level 47
  112800,   // Level 48
  117600,   // Level 49
  122500,   // Level 50 — Diamante
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

// ──────────────────────────────
// Pass Tier system — 5 ranks x 10 levels each = 50 levels total
// Progressive reveal: next tier shows up 5 levels before reaching it
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
  /** Level at which this tier is revealed (visible) in the UI */
  revealLevel: number;
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
    maxLevel: 10,
    revealLevel: 1,
  },
  {
    id: 'silver',
    name: 'Plata',
    icon: '🥈',
    color: '#C0C0C0',
    gradient: 'linear-gradient(135deg, #E8E8E8, #A0A0A0)',
    glowColor: 'rgba(192, 192, 192, 0.4)',
    minLevel: 11,
    maxLevel: 20,
    revealLevel: 6,
  },
  {
    id: 'gold',
    name: 'Oro',
    icon: '🥇',
    color: '#FFD700',
    gradient: 'linear-gradient(135deg, #FFD700, #FF8C00)',
    glowColor: 'rgba(255, 215, 0, 0.4)',
    minLevel: 21,
    maxLevel: 30,
    revealLevel: 16,
  },
  {
    id: 'platinum',
    name: 'Platino',
    icon: '💎',
    color: '#00E5FF',
    gradient: 'linear-gradient(135deg, #00E5FF, #0099CC)',
    glowColor: 'rgba(0, 229, 255, 0.4)',
    minLevel: 31,
    maxLevel: 40,
    revealLevel: 26,
  },
  {
    id: 'diamond',
    name: 'Diamante',
    icon: '🔮',
    color: '#B026FF',
    gradient: 'linear-gradient(135deg, #B026FF, #6B21A8)',
    glowColor: 'rgba(176, 38, 255, 0.4)',
    minLevel: 41,
    maxLevel: 50,
    revealLevel: 36,
  },
];

export function getTierForLevel(level: number): PassTier {
  for (let i = PASS_TIERS.length - 1; i >= 0; i--) {
    if (level >= PASS_TIERS[i].minLevel) return PASS_TIERS[i];
  }
  return PASS_TIERS[0];
}

/** Whether a tier is revealed (visible) to the user based on their level */
export function isTierRevealed(tier: PassTier, userLevel: number): boolean {
  return userLevel >= tier.revealLevel;
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
