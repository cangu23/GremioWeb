import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Prisma mock ──
const mockPrisma = vi.hoisted(() => ({
  rouletteSpin: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() },
  user: { update: vi.fn() },
  $connect: vi.fn(),
  $disconnect: vi.fn(),
}));

vi.mock('../../database/prisma', () => ({
  default: mockPrisma,
}));

// ── GamificationRepository mock ──
const mockAddXp = vi.hoisted(() => vi.fn().mockResolvedValue(10));
vi.mock('../gamification/gamification.repository', () => ({
  addXpToUser: mockAddXp,
}));

// ── StardustService mock ──
const mockSpendStardust = vi.hoisted(() => vi.fn().mockResolvedValue({ stardustSpent: 50, newBalance: 450 }));
const mockAddStardust = vi.hoisted(() => vi.fn().mockResolvedValue({ stardustEarned: 5, newBalance: 505 }));
const mockGetStardustBalance = vi.hoisted(() => vi.fn().mockResolvedValue({ stardust: 500 }));

vi.mock('../ecosystem/stardust.service', () => ({
  addStardust: mockAddStardust,
  spendStardust: mockSpendStardust,
  getStardustBalance: mockGetStardustBalance,
}));

// ── Import SUT ──
import * as RouletteService from './roulette.service';

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

describe('RouletteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStardustBalance.mockResolvedValue({ stardust: 500 });
    mockAddStardust.mockResolvedValue({ stardustEarned: 5, newBalance: 505 });
    mockSpendStardust.mockResolvedValue({ stardustSpent: 50, newBalance: 450 });
  });

  // ── getStatus ──────────────────────────────────
  describe('getStatus', () => {
    it('returns canSpin=true when no previous spin', async () => {
      mockPrisma.rouletteSpin.findFirst.mockResolvedValue(null);
      mockPrisma.rouletteSpin.findMany.mockResolvedValue([]);

      const status = await RouletteService.getStatus('user-1');
      expect(status.canSpin).toBe(true);
      expect(status.nextSpinAt).toBeNull();
      expect(status.stardustCostForExtraSpin).toBe(50);
    });

    it('returns canSpin=true when 24h+ have passed', async () => {
      mockPrisma.rouletteSpin.findFirst.mockResolvedValue({
        createdAt: hoursAgo(25),
      });
      mockPrisma.rouletteSpin.findMany.mockResolvedValue([]);

      const status = await RouletteService.getStatus('user-1');
      expect(status.canSpin).toBe(true);
    });

    it('returns canSpin=false when <24h since last spin', async () => {
      mockPrisma.rouletteSpin.findFirst.mockResolvedValue({
        createdAt: hoursAgo(5),
      });
      mockPrisma.rouletteSpin.findMany.mockResolvedValue([]);

      const status = await RouletteService.getStatus('user-1');
      expect(status.canSpin).toBe(false);
    });

    it('returns the prize list', async () => {
      mockPrisma.rouletteSpin.findFirst.mockResolvedValue(null);
      mockPrisma.rouletteSpin.findMany.mockResolvedValue([]);

      const status = await RouletteService.getStatus('user-1');
      expect(status.prizes).toHaveLength(8);
      expect(status.prizes[0].label).toBe('10 XP');
    });
  });

  // ── spin ───────────────────────────────────────
  describe('spin', () => {
    it('throws if already spun today', async () => {
      mockPrisma.rouletteSpin.findFirst.mockResolvedValue({
        createdAt: hoursAgo(3),
      });
      mockPrisma.rouletteSpin.findMany.mockResolvedValue([]);

      await expect(RouletteService.spin('user-1')).rejects.toThrow(
        'Ya giraste la ruleta hoy'
      );
    });

    it('returns a valid prize and rotation', async () => {
      mockPrisma.rouletteSpin.findFirst.mockResolvedValue(null);
      mockPrisma.rouletteSpin.findMany.mockResolvedValue([]);
      mockPrisma.rouletteSpin.create.mockResolvedValue({});

      const result = await RouletteService.spin('user-1');

      expect(result.prize).toBeDefined();
      expect(result.prize.id).toBeTruthy();
      expect(result.rotation).toBeGreaterThanOrEqual(720);
      expect(result.message).toBeTruthy();
    });

    it('records the spin in the database', async () => {
      mockPrisma.rouletteSpin.findFirst.mockResolvedValue(null);
      mockPrisma.rouletteSpin.findMany.mockResolvedValue([]);
      mockPrisma.rouletteSpin.create.mockResolvedValue({});

      await RouletteService.spin('user-1');

      expect(mockPrisma.rouletteSpin.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          prize: expect.any(String),
          prizeLabel: expect.any(String),
          prizeValue: expect.any(Number),
        }),
      });
    });
  });

  // ── spinWithStardust ───────────────────────────
  describe('spinWithStardust', () => {
    it('spends stardust and returns prize', async () => {
      mockSpendStardust.mockResolvedValue({ stardustSpent: 50, newBalance: 450 });
      mockPrisma.rouletteSpin.findMany.mockResolvedValue([]);
      mockPrisma.rouletteSpin.create.mockResolvedValue({});

      const result = await RouletteService.spinWithStardust('user-1');

      expect(mockSpendStardust).toHaveBeenCalledWith('user-1', 50, 'Giro extra de Ruleta');
      expect(result.prize).toBeDefined();
      expect(result.rotation).toBeGreaterThanOrEqual(720);
    });
  });

  // ── getStats ───────────────────────────────────
  describe('getStats', () => {
    it('returns user stats summary', async () => {
      mockPrisma.rouletteSpin.findMany.mockResolvedValue([
        { prizeValue: 50, createdAt: new Date() },
        { prizeValue: 200, createdAt: new Date() },
      ]);

      const stats = await RouletteService.getStats('user-1');

      expect(stats.totalSpins).toBe(2);
      expect(stats.totalXpEarned).toBe(250);
      expect(stats.highestXpWon).toBe(200);
    });
  });

  // ── getHistory ─────────────────────────────────
  describe('getHistory', () => {
    it('returns empty array when no spins', async () => {
      mockPrisma.rouletteSpin.findMany.mockResolvedValue([]);

      const history = await RouletteService.getHistory('user-1');
      expect(history).toEqual([]);
    });

    it('returns formatted spin history', async () => {
      const mockSpins = [
        { id: 's1', prize: 'xp_50', prizeLabel: '50 XP', prizeValue: 50, createdAt: new Date('2025-01-01') },
      ];
      mockPrisma.rouletteSpin.findMany.mockResolvedValue(mockSpins);

      const history = await RouletteService.getHistory('user-1');
      expect(history).toHaveLength(1);
      expect(history[0].prize).toBe('xp_50');
    });
  });
});
