import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Prisma mock (vi.hoisted ensures init BEFORE vi.mock runs) ──
const mockPrisma = vi.hoisted(() => ({
  dailyReward: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), count: vi.fn() },
  userPurchase: { findFirst: vi.fn(), delete: vi.fn(), update: vi.fn() },
  user: { update: vi.fn(), findUnique: vi.fn() },
  // Mocks de mission/userMissionProgress: claim() llama a trackMissionProgress
  // (DAILY_LOGIN) y sin ellos el mock crasheaba con
  // "Cannot read properties of undefined (reading 'findMany')".
  mission: { findMany: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  userMissionProgress: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
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

function yesterdayDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

function daysAgoDate(numDays: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - numDays);
  return d;
}

describe('DailyRewardsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Free plan por defecto → multiplicador ×1 (no altera el XP esperado)
    mockPrisma.user.findUnique.mockResolvedValue({ plan: 'FREE', role: 'USER' });
    // Sin misiones activas por defecto → trackMissionProgress no itera nada
    mockPrisma.mission.findMany.mockResolvedValue([]);
    mockPrisma.userMissionProgress.findFirst.mockResolvedValue(null);
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

    it('returns canClaim=true when last claim was yesterday', async () => {
      mockPrisma.dailyReward.findFirst.mockResolvedValue({
        claimedAt: yesterdayDate(),
        day: 2,
      });
      mockPrisma.dailyReward.findMany.mockResolvedValue([]);
      mockPrisma.dailyReward.count.mockResolvedValue(1);

      const status = await DailyRewardsService.getStatus('user-1');
      expect(status.canClaim).toBe(true);
    });

    it('returns canClaim=false when claimed today', async () => {
      mockPrisma.dailyReward.findFirst.mockResolvedValue({
        claimedAt: new Date(),
        day: 1,
      });
      mockPrisma.dailyReward.findMany.mockResolvedValue([]);
      mockPrisma.dailyReward.count.mockResolvedValue(1);

      const status = await DailyRewardsService.getStatus('user-1');
      expect(status.canClaim).toBe(false);
    });

    it('resets streak to day 1 when 2+ days have passed', async () => {
      mockPrisma.dailyReward.findFirst.mockResolvedValue({
        claimedAt: daysAgoDate(3),
        day: 4,
      });
      mockPrisma.dailyReward.findMany.mockResolvedValue([]);
      mockPrisma.dailyReward.count.mockResolvedValue(4);

      const status = await DailyRewardsService.getStatus('user-1');
      expect(status.currentDay).toBe(1);
    });

    it('continues streak if claimed yesterday', async () => {
      mockPrisma.dailyReward.findFirst.mockResolvedValue({
        claimedAt: yesterdayDate(),
        day: 3,
      });
      mockPrisma.dailyReward.findMany.mockResolvedValue([]);
      mockPrisma.dailyReward.count.mockResolvedValue(3);

      const status = await DailyRewardsService.getStatus('user-1');
      expect(status.currentDay).toBe(4);
    });

    it('resets to day 1 after completing day 7', async () => {
      mockPrisma.dailyReward.findFirst.mockResolvedValue({
        claimedAt: yesterdayDate(),
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
        claimedAt: new Date(),
        day: 1,
      });
      mockPrisma.dailyReward.findMany.mockResolvedValue([]);
      mockPrisma.dailyReward.count.mockResolvedValue(1);

      await expect(DailyRewardsService.claim('user-1')).rejects.toThrow(
        'Ya reclamaste tu recompensa hoy'
      );
    });

    it('awards XP and records the claim with the anti-double-claim claimDate', async () => {
      mockPrisma.dailyReward.findFirst.mockResolvedValue(null); // no prev claim → day 1
      mockPrisma.dailyReward.findMany.mockResolvedValue([]);
      mockPrisma.dailyReward.count.mockResolvedValue(0);
      mockPrisma.dailyReward.create.mockResolvedValue({
        userId: 'user-1',
        day: 1,
        xpAwarded: 50,
        bonus: false,
        claimDate: new Date().toISOString().split('T')[0],
      });

      const result = await DailyRewardsService.claim('user-1');

      expect(mockAddXp).toHaveBeenCalledWith('user-1', 50);
      expect(mockPrisma.dailyReward.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          day: 1,
          xpAwarded: 50,
          bonus: false,
          claimDate: new Date().toISOString().split('T')[0],
        }),
      });
      expect(result.xpAwarded).toBe(50);
      expect(result.day).toBe(1);
    });

    it('rejects with 429 when the unique (userId, claimDate) guard fires (P2002)', async () => {
      mockPrisma.dailyReward.findFirst.mockResolvedValue(null);
      mockPrisma.dailyReward.findMany.mockResolvedValue([]);
      mockPrisma.dailyReward.count.mockResolvedValue(0);
      mockPrisma.dailyReward.create.mockRejectedValue({ code: 'P2002' });

      await expect(DailyRewardsService.claim('user-1')).rejects.toThrow(
        'Ya reclamaste tu recompensa hoy'
      );
      expect(mockAddXp).not.toHaveBeenCalled();
    });

    it('awards bonus XP on day 7', async () => {
      mockPrisma.dailyReward.findFirst.mockResolvedValue({
        claimedAt: yesterdayDate(),
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
