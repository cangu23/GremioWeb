import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  normalizeCreatorCode,
  validateCreatorCode,
  CREATOR_COMMISSION_RATE,
  MIN_PAYOUT_AMOUNT,
} from './creator-codes.service';

const mockPrisma = vi.hoisted(() => ({
  creatorCode: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  creatorPayout: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  creatorEarningsLog: {
    create: vi.fn(),
    findMany: vi.fn(),
    aggregate: vi.fn(),
  },
  $transaction: vi.fn(async (fn: any) => {
    if (typeof fn === 'function') {
      return fn(mockPrisma);
    }
    return Promise.all(fn);
  }),
}));

vi.mock('../../database/prisma', () => ({
  default: mockPrisma,
}));

describe('Creator Codes & Creator Economy Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('normalizeCreatorCode', () => {
    it('should normalize creator code to uppercase and remove special characters', () => {
      expect(normalizeCreatorCode('  vtuber_luna! ')).toBe('VTUBER_LUNA');
      expect(normalizeCreatorCode('maid-stella#123')).toBe('MAIDSTELLA123');
      expect(normalizeCreatorCode('cangu')).toBe('CANGU');
    });
  });

  describe('validateCreatorCode', () => {
    it('should return invalid if code is too short', async () => {
      const result = await validateCreatorCode('a');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('demasiado corto');
    });

    it('should reject when code is not found or inactive', async () => {
      mockPrisma.creatorCode.findUnique.mockResolvedValueOnce(null);
      const result = await validateCreatorCode('UNKNOWN_CODE');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('no válido');
    });

    it('should reject when buyer tries to use their own code', async () => {
      mockPrisma.creatorCode.findUnique.mockResolvedValueOnce({
        id: 'code-1',
        code: 'MYCODE',
        userId: 'user-creator',
        status: 'ACTIVE',
        user: { id: 'user-creator', username: 'creator', role: 'VTUBER' },
      });

      const result = await validateCreatorCode('MYCODE', 'user-creator');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('No puedes usar tu propio código');
    });

    it('should return valid info with 10% bonus when code is valid', async () => {
      mockPrisma.creatorCode.findUnique.mockResolvedValueOnce({
        id: 'code-1',
        code: 'LUNA',
        userId: 'vtuber-1',
        status: 'ACTIVE',
        user: {
          id: 'vtuber-1',
          username: 'luna_vtuber',
          displayName: 'Luna Channel',
          role: 'VTUBER',
          vtuberProfile: { displayName: 'Luna VTuber' },
        },
      });

      const result = await validateCreatorCode('luna', 'fan-123');
      expect(result.valid).toBe(true);
      expect(result.code).toBe('LUNA');
      expect(result.bonusPercent).toBe(10);
      expect(result.creator?.name).toBe('Luna VTuber');
    });
  });

  describe('constants', () => {
    it('should have 35% commission rate and $10 min payout', () => {
      expect(CREATOR_COMMISSION_RATE).toBe(0.35);
      expect(MIN_PAYOUT_AMOUNT).toBe(10.0);
    });
  });
});

