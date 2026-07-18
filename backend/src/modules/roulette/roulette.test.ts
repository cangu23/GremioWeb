import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Prisma mock (vi.hoisted ensures init BEFORE vi.mock runs) ──
const mockPrisma = vi.hoisted(() => ({
  rouletteSpin: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() },
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
import * as RouletteService from './roulette.service';

// ── Helpers ──────────────────────────────────────
function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

// Helper: spin many times to verify prize distribution roughly matches weights
function simulateSpins(count: number): Record<string, number> {
  const counts: Record<string, number> = {};
  for (let i = 0; i < count; i++) {
    mockPrisma.rouletteSpin.findFirst.mockResolvedValue(null); // can spin
    mockPrisma.rouletteSpin.create.mockResolvedValue({});
    // We can't directly test the random, but we can test the pickPrize logic
  }
  return counts;
}

describe('RouletteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getStatus ──────────────────────────────────
  describe('getStatus', () => {
    it('returns canSpin=true when no previous spin', async () => {
      mockPrisma.rouletteSpin.findFirst.mockResolvedValue(null);

      const status = await RouletteService.getStatus('user-1');
      expect(status.canSpin).toBe(true);
      expect(status.nextSpinAt).toBeNull();
    });

    it('returns canSpin=true when 24h+ have passed', async () => {
      mockPrisma.rouletteSpin.findFirst.mockResolvedValue({
        createdAt: hoursAgo(25),
      });

      const status = await RouletteService.getStatus('user-1');
      expect(status.canSpin).toBe(true);
    });

    it('returns canSpin=false when <24h since last spin', async () => {
      mockPrisma.rouletteSpin.findFirst.mockResolvedValue({
        createdAt: hoursAgo(5),
      });

      const status = await RouletteService.getStatus('user-1');
      expect(status.canSpin).toBe(false);
    });

    it('returns the prize list', async () => {
      mockPrisma.rouletteSpin.findFirst.mockResolvedValue(null);

      const status = await RouletteService.getStatus('user-1');
      expect(status.prizes).toHaveLength(8); // 7 prizes + nothing
      expect(status.prizes[0].label).toBe('10 XP');
      expect(status.prizes[status.prizes.length - 1].label).toBe('¡Suerte para la próxima!');
    });
  });

  // ── spin ───────────────────────────────────────
  describe('spin', () => {
    it('throws if already spun today', async () => {
      mockPrisma.rouletteSpin.findFirst.mockResolvedValue({
        createdAt: hoursAgo(3),
      });

      await expect(RouletteService.spin('user-1')).rejects.toThrow(
        'Ya giraste la ruleta hoy'
      );
    });

    it('returns a valid prize and rotation', async () => {
      mockPrisma.rouletteSpin.findFirst.mockResolvedValue(null);
      mockPrisma.rouletteSpin.create.mockResolvedValue({});

      const result = await RouletteService.spin('user-1');

      expect(result.prize).toBeDefined();
      expect(result.prize.id).toBeTruthy();
      expect(result.rotation).toBeGreaterThanOrEqual(720);
      expect(result.message).toBeTruthy();
    });

    it('awards XP when prize has value > 0', async () => {
      mockPrisma.rouletteSpin.findFirst.mockResolvedValue(null);
      mockPrisma.rouletteSpin.create.mockResolvedValue({});

      const result = await RouletteService.spin('user-1');

      if (result.prize.value > 0) {
        expect(mockAddXp).toHaveBeenCalledWith('user-1', result.prize.value);
      }
    });

    it('does not award XP for badge or nothing prizes', async () => {
      // Force Math.random to land on the 'badge_lucky' segment
      // The prizes array has 8 items with total weight 100.
      // badge_lucky is at index 6 with weight 2 (cumulative 97-98 range).
      // nothing is at index 7 with weight 1 (cumulative 99 range).
      // To get badge_lucky: cumulative up to index 5 is 97, so random=0.975 gives us badge_lucky (index 6)
      vi.spyOn(Math, 'random').mockReturnValue(0.975);

      mockPrisma.rouletteSpin.findFirst.mockResolvedValue(null);
      mockPrisma.rouletteSpin.create.mockResolvedValue({});

      const result = await RouletteService.spin('user-1');

      expect(result.prize.id).toBe('badge_lucky');
      expect(result.prize.value).toBe(0);
      expect(mockAddXp).not.toHaveBeenCalled();

      vi.restoreAllMocks();
    });

    it('skips addXp when landing on "nothing" prize', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.998); // lands on "nothing" (index 7)

      mockPrisma.rouletteSpin.findFirst.mockResolvedValue(null);
      mockPrisma.rouletteSpin.create.mockResolvedValue({});

      const result = await RouletteService.spin('user-1');

      expect(result.prize.id).toBe('nothing');
      expect(result.prize.value).toBe(0);
      expect(mockAddXp).not.toHaveBeenCalled();

      vi.restoreAllMocks();
    });

    it('records the spin in the database', async () => {
      mockPrisma.rouletteSpin.findFirst.mockResolvedValue(null);
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

    it('returns rotation within expected range', async () => {
      mockPrisma.rouletteSpin.findFirst.mockResolvedValue(null);
      mockPrisma.rouletteSpin.create.mockResolvedValue({});

      // Run multiple spins and check rotation is always valid
      for (let i = 0; i < 20; i++) {
        const result = await RouletteService.spin(`user-${i}`);
        expect(result.rotation).toBeGreaterThanOrEqual(720);
        expect(result.rotation).toBeLessThanOrEqual(1440 + 360); // max possible
      }
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
        { id: 's2', prize: 'nothing', prizeLabel: '¡Suerte para la próxima!', prizeValue: 0, createdAt: new Date('2025-01-02') },
      ];
      mockPrisma.rouletteSpin.findMany.mockResolvedValue(mockSpins);

      const history = await RouletteService.getHistory('user-1');
      expect(history).toHaveLength(2);
      expect(history[0].prize).toBe('xp_50');
      expect(history[1].prize).toBe('nothing');
      expect(history[0].createdAt).toBe(new Date('2025-01-01').toISOString());
    });
  });
});
