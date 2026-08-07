import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockShopRepository = vi.hoisted(() => ({
  findUserPurchase: vi.fn(),
  deletePurchase: vi.fn(),
}));

const mockStardustService = vi.hoisted(() => ({
  spendStardust: vi.fn(),
  addStardust: vi.fn(),
}));

vi.mock('./shop.repository', () => mockShopRepository);
vi.mock('../ecosystem/stardust.service', () => mockStardustService);
vi.mock('../../database/prisma', () => ({
  default: {
    user: { findUnique: vi.fn() },
    shopItem: { updateMany: vi.fn(), update: vi.fn() },
  },
}));
vi.mock('../ecosystem/missions.service', () => ({
  trackMissionProgress: vi.fn(),
}));

import { refundItem } from './shop.service';

const makePurchase = (type: string, remaining: number | null, price = 100) => ({
  id: 'purchase-1',
  userId: 'user-1',
  itemId: 'item-1',
  equipped: false,
  remaining,
  item: { id: 'item-1', type, price, data: null },
});

describe('ShopService.refundItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws 404 if the user does not own the item', async () => {
    mockShopRepository.findUserPurchase.mockResolvedValue(null);

    await expect(refundItem('user-1', 'item-1')).rejects.toThrow('No posees este ítem');
    expect(mockShopRepository.deletePurchase).not.toHaveBeenCalled();
    expect(mockStardustService.addStardust).not.toHaveBeenCalled();
  });

  it('rejects refund of a multi-use consumable that was partially used (remaining < initial uses)', async () => {
    // PIN_POST is the only 3-use consumable; remaining=1 means 2 uses were consumed
    mockShopRepository.findUserPurchase.mockResolvedValue(makePurchase('PIN_POST', 1));

    await expect(refundItem('user-1', 'item-1')).rejects.toThrow(
      'No puedes reembolsar un consumible que ya fue usado.'
    );
    expect(mockShopRepository.deletePurchase).not.toHaveBeenCalled();
    expect(mockStardustService.addStardust).not.toHaveBeenCalled();
  });

  it('rejects refund of a single-use consumable whose remaining is 0', async () => {
    mockShopRepository.findUserPurchase.mockResolvedValue(makePurchase('ROULETTE_TOKEN', 0));

    await expect(refundItem('user-1', 'item-1')).rejects.toThrow(
      'No puedes reembolsar un consumible que ya fue usado.'
    );
  });

  it('allows refund of a fully unused multi-use consumable', async () => {
    mockShopRepository.findUserPurchase.mockResolvedValue(makePurchase('PIN_POST', 3));
    mockShopRepository.deletePurchase.mockResolvedValue({});
    mockStardustService.addStardust.mockResolvedValue({ newBalance: 500 });

    const result = await refundItem('user-1', 'item-1');

    expect(result.refundedStardust).toBe(100);
    expect(mockShopRepository.deletePurchase).toHaveBeenCalledWith('purchase-1');
    expect(mockStardustService.addStardust).toHaveBeenCalledWith('user-1', 100, expect.any(String));
  });

  it('allows refund of a fully unused single-use consumable', async () => {
    mockShopRepository.findUserPurchase.mockResolvedValue(makePurchase('STREAK_SAVER', 1));
    mockShopRepository.deletePurchase.mockResolvedValue({});
    mockStardustService.addStardust.mockResolvedValue({ newBalance: 100 });

    const result = await refundItem('user-1', 'item-1');

    expect(result.refundedStardust).toBe(100);
    expect(mockShopRepository.deletePurchase).toHaveBeenCalledWith('purchase-1');
  });

  it('allows refund of non-consumable items (e.g. badges)', async () => {
    mockShopRepository.findUserPurchase.mockResolvedValue(makePurchase('BADGE', null));
    mockShopRepository.deletePurchase.mockResolvedValue({});
    mockStardustService.addStardust.mockResolvedValue({ newBalance: 100 });

    const result = await refundItem('user-1', 'item-1');

    expect(result.refundedStardust).toBe(100);
    expect(mockShopRepository.deletePurchase).toHaveBeenCalledWith('purchase-1');
  });

  it('documents the stacked multi-use case: remaining >= initial uses passes the guard (refund only returns a single item price, so no net farm)', async () => {
    // User bought 2 stacks of PIN_POST (2×3 = 6 uses) and consumed 3: remaining 3.
    // The guard cannot detect usage from `remaining` alone (3 is not < 3), so the
    // refund is allowed — but it returns the price of ONE item and deletes all
    // remaining uses, which is economically neutral, not a farm.
    mockShopRepository.findUserPurchase.mockResolvedValue(makePurchase('PIN_POST', 3));
    mockShopRepository.deletePurchase.mockResolvedValue({});
    mockStardustService.addStardust.mockResolvedValue({ newBalance: 100 });

    const result = await refundItem('user-1', 'item-1');

    expect(result.refundedStardust).toBe(100);
    expect(mockShopRepository.deletePurchase).toHaveBeenCalledWith('purchase-1');
  });
});
