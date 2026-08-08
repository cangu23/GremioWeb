import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Prisma mock (vi.hoisted ensures init BEFORE vi.mock runs) ──
const mockPrisma = vi.hoisted(() => ({
  vTuberProfile: { upsert: vi.fn(), update: vi.fn() },
  user: { findUnique: vi.fn(), update: vi.fn() },
  notification: { create: vi.fn() },
  platformSubscription: { findUnique: vi.fn(), upsert: vi.fn(), update: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock('../../database/prisma', () => ({
  default: mockPrisma,
}));

// ── AdminRepository mock ─────────────────────────
vi.mock('./admin.repository', () => ({
  findUserById: vi.fn(),
  updateUser: vi.fn(),
  createAdminLog: vi.fn(),
}));

// Evita cargar prisma real vía platform-subscriptions / user.service
vi.mock('../subscriptions/platform-subscriptions.service', () => ({
  activatePlatformPlan: vi.fn(),
  PLATFORM_PLANS: {},
}));

vi.mock('../users/user.service', () => ({
  hardDeleteUser: vi.fn(),
}));

// ── Import SUT ───────────────────────────────────
import * as AdminService from './admin.service';
import * as AdminRepository from './admin.repository';

describe('AdminService.updateUser — verificación (isVerified)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (AdminRepository.findUserById as any).mockResolvedValue({
      id: 'user-1',
      username: 'testuser',
      displayName: 'Test User',
      avatarUrl: null,
      role: 'USER',
      status: 'ACTIVE',
      plan: 'FREE',
    });
    (AdminRepository.updateUser as any).mockImplementation((id: string, data: any) =>
      Promise.resolve({ id, ...data })
    );
    mockPrisma.vTuberProfile.upsert.mockResolvedValue({ userId: 'user-1', isVerified: true });
  });

  it("verifica a un usuario: isVerified va al VTuberProfile, NO al update de User", async () => {
    await AdminService.updateUser('user-1', { isVerified: true }, 'admin-1');

    // isVerified no es columna de User: pasarla al update directo lanzaba
    // "Unknown argument isVerified" → 500. No debe aparecer en el update.
    expect(AdminRepository.updateUser).toHaveBeenCalledWith(
      'user-1',
      expect.not.objectContaining({ isVerified: expect.anything() })
    );
    // El upsert del perfil VTuber sí recibe isVerified
    expect(mockPrisma.vTuberProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ isVerified: true, isApproved: true }),
      })
    );
  });

  it("quita la verificación (isVerified: false) sin romper el update de User", async () => {
    mockPrisma.vTuberProfile.upsert.mockResolvedValue({ userId: 'user-1', isVerified: false });

    await AdminService.updateUser('user-1', { isVerified: false }, 'admin-1');

    expect(AdminRepository.updateUser).toHaveBeenCalledWith(
      'user-1',
      expect.not.objectContaining({ isVerified: expect.anything() })
    );
    expect(mockPrisma.vTuberProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ isVerified: false, isApproved: true }),
      })
    );
  });

  it("combina rol + verificación: solo los campos de User van al update, isVerified al perfil", async () => {
    await AdminService.updateUser('user-1', { role: 'VTUBER', isVerified: true }, 'admin-1');

    expect(AdminRepository.updateUser).toHaveBeenCalledWith('user-1', { role: 'VTUBER' });
    expect(mockPrisma.vTuberProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ isVerified: true, isApproved: true }),
      })
    );
  });

  it("un admin no puede degradarse a sí mismo (auto-protección)", async () => {
    await expect(AdminService.updateUser('admin-1', { role: 'USER' }, 'admin-1')).rejects.toThrow(
      'No puedes degradar tu propio rango de Administrador'
    );
    expect(AdminRepository.updateUser).not.toHaveBeenCalled();
  });
});
