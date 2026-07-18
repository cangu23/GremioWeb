import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Prisma mock (vi.hoisted ensures init BEFORE vi.mock runs) ──
const mockPrisma = vi.hoisted(() => ({
  dailyReward: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), count: vi.fn() },
  user: { update: vi.fn() },
  $connect: vi.fn(),
  $disconnect: vi.fn(),
}));

vi.mock('../../database/prisma', () => ({
  default: mockPrisma,
}));

// ── GamificationRepository mock ──────────────────
const mockAddXp = vi.hoisted(() => vi.fn());
vi.mock('../gamification/gamification.repository', () => ({
  addXpToUser: mockAddXp,
}));

// ── Import SUT ───────────────────────────────────
import * as DailyRewardsService from './daily-rewards.service';

// ── Helpers ──────────────────────────────────────
function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

describe('DailyRewardsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getStatus ──────────────────────────────────
  describe('getStatus', () => {
    it('returns canClaim=true when no previous claim exists', async () => {
      mockPrisma.dailyReward.findFirst.mockResolvedValue(null);
      mockPrisma.dailyReward.findMany.mockResolvedValue([]);
      mockPrisma.dailyReward.count.mockResolvedValue(0);

      const status = await DailyRewardsService.getStatus('user-1');
      expect(status.canClaim).toBe(true);
      expect(status.currentDay).toBe(1);
      expect(status.totalClaims).toBe(0);
      expect(status.history).toEqual([]);
    });

    it('returns canClaim=true when 24h+ have passed since last claim', async () => {
      mockPrisma.dailyReward.findFirst.mockResolvedValue({
        claimedAt: hoursAgo(25),
        day: 2,
      });
      mockPrisma.dailyReward.findMany.mockResolvedValue([]);
      mockPrisma.dailyReward.count.mockResolvedValue(1);

      const status = await DailyRewardsService.getStatus('user-1');
      expect(status.canClaim).toBe(true);
    });

    it('returns canClaim=false when <24h since last claim', async () => {
      mockPrisma.dailyReward.findFirst.mockResolvedValue({
        claimedAt: hoursAgo(10),
        day: 1,
      });
      mockPrisma.dailyReward.findMany.mockResolvedValue([]);
      mockPrisma.dailyReward.count.mockResolvedValue(1);

      const status = await DailyRewardsService.getStatus('user-1');
      expect(status.canClaim).toBe(false);
    });

    it('resets streak to day 1 when 48h+ have passed', async () => {
      mockPrisma.dailyReward.findFirst.mockResolvedValue({
        claimedAt: daysAgo(3),
        day: 4,
      });
      mockPrisma.dailyReward.findMany.mockResolvedValue([]);
      mockPrisma.dailyReward.count.mockResolvedValue(4);

      const status = await DailyRewardsService.getStatus('user-1');
      expect(status.currentDay).toBe(1);
    });

    it('continues streak if within 48h window', async () => {
      mockPrisma.dailyReward.findFirst.mockResolvedValue({
        claimedAt: hoursAgo(30),
        day: 3,
      });
      mockPrisma.dailyReward.findMany.mockResolvedValue([]);
      mockPrisma.dailyReward.count.mockResolvedValue(3);

      const status = await DailyRewardsService.getStatus('user-1');
      expect(status.currentDay).toBe(4);
    });

    it('resets to day 1 after completing day 7', async () => {
      mockPrisma.dailyReward.findFirst.mockResolvedValue({
        claimedAt: hoursAgo(30),
        day: 7,
      });
      mockPrisma.dailyReward.findMany.mockResolvedValue([]);
      mockPrisma.dailyReward.count.mockResolvedValue(7);

      const status = await DailyRewardsService.getStatus('user-1');
      expect(status.currentDay).toBe(1);
    });

    it('returns the reward tiers in status', async () => {
      mockPrisma.dailyReward.findFirst.mockResolvedValue(null);
      mockPrisma.dailyReward.findMany.mockResolvedValue([]);
      mockPrisma.dailyReward.count.mockResolvedValue(0);

      const status = await DailyRewardsService.getStatus('user-1');
      expect(status.rewards).toHaveLength(7);
      expect(status.rewards[0].xp).toBe(50);
      expect(status.rewards[6].xp).toBe(500);
      expect(status.rewards[6].bonus).toBe(true);
    });
  });

  // ── claim ──────────────────────────────────────
  describe('claim', () => {
    it('throws if already claimed today', async () => {
      mockPrisma.dailyReward.findFirst.mockResolvedValue({
        claimedAt: hoursAgo(5),
        day: 1,
      });
      mockPrisma.dailyReward.findMany.mockResolvedValue([]);
      mockPrisma.dailyReward.count.mockResolvedValue(1);

      await expect(DailyRewardsService.claim('user-1')).rejects.toThrow(
        'Ya reclamaste tu recompensa hoy'
      );
    });

    it('awards XP and records the claim', async () => {
      mockPrisma.dailyReward.findFirst.mockResolvedValue(null); // no prev claim → day 1
      mockPrisma.dailyReward.findMany.mockResolvedValue([]);
      mockPrisma.dailyReward.count.mockResolvedValue(0);
      mockPrisma.dailyReward.create.mockResolvedValue({
        userId: 'user-1',
        day: 1,
        xpAwarded: 50,
        bonus: false,
      });

      const result = await DailyRewardsService.claim('user-1');

      expect(mockAddXp).toHaveBeenCalledWith('user-1', 50);
      expect(mockPrisma.dailyReward.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', day: 1, xpAwarded: 50, bonus: false },
      });
      expect(result.xpAwarded).toBe(50);
      expect(result.day).toBe(1);
    });

    it('awards bonus XP on day 7', async () => {
      // Mock that user has claimed 6 times, last one 30h ago → streak continues → day 7
      mockPrisma.dailyReward.findFirst.mockResolvedValue({
        claimedAt: hoursAgo(30),
        day: 6,
      });
      mockPrisma.dailyReward.findMany.mockResolvedValue([]);
      mockPrisma.dailyReward.count.mockResolvedValue(6);
      mockPrisma.dailyReward.create.mockResolvedValue({
        userId: 'user-1',
        day: 7,
        xpAwarded: 500,
        bonus: true,
      });

      const result = await DailyRewardsService.claim('user-1');

      expect(mockAddXp).toHaveBeenCalledWith('user-1', 500);
      expect(result.xpAwarded).toBe(500);
      expect(result.bonus).toBe(true);
      expect(result.label).toContain('BONUS');
    });
  });
});
