import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Prisma mock (vi.hoisted ensures init BEFORE vi.mock runs) ──
const mockPrisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), update: vi.fn() },
  warning: { findMany: vi.fn(), create: vi.fn(), count: vi.fn() },
  notification: { create: vi.fn() },
  adminLog: { create: vi.fn() },
  chatMessage: { findUnique: vi.fn(), delete: vi.fn() },
  directMessage: { findUnique: vi.fn(), delete: vi.fn() },
  post: { findUnique: vi.fn(), delete: vi.fn() },
  $connect: vi.fn(),
  $disconnect: vi.fn(),
}));

vi.mock('../../database/prisma', () => ({
  default: mockPrisma,
}));

// ── AdminRepository mock ─────────────────────────
vi.mock('../admin/admin.repository', () => ({
  createAdminLog: vi.fn(),
}));

// ── Import SUT ───────────────────────────────────
import * as WarningsService from './warnings.service';

describe('WarningsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── issueWarning ───────────────────────────────
  describe('issueWarning', () => {
    const userId = 'user-1';
    const warnedById = 'admin-1';
    const reason = 'Comportamiento inapropiado';

    it('throws when reason is empty', async () => {
      await expect(WarningsService.issueWarning(userId, warnedById, '')).rejects.toThrow(
        'Debes proporcionar una razón'
      );
      await expect(WarningsService.issueWarning(userId, warnedById, '   ')).rejects.toThrow(
        'Debes proporcionar una razón'
      );
    });

    it('throws when target user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(WarningsService.issueWarning('nonexistent', warnedById, reason)).rejects.toThrow(
        'Usuario no encontrado'
      );
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'nonexistent' } });
    });

    it('creates a warning with correct strike number (1st)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, username: 'testuser', status: 'ACTIVE' });
      mockPrisma.warning.count.mockResolvedValue(0);
      mockPrisma.warning.create.mockResolvedValue({
        id: 'w-1',
        strike: 1,
        reason,
        createdAt: new Date('2025-01-01'),
      });

      const result = await WarningsService.issueWarning(userId, warnedById, reason);

      expect(result.warning.strike).toBe(1);
      expect(mockPrisma.warning.create).toHaveBeenCalledWith({
        data: { userId, warnedById, reason: reason.trim(), strike: 1 },
      });
    });

    it('creates a warning with correct strike number (2nd)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, username: 'testuser', status: 'ACTIVE' });
      mockPrisma.warning.count.mockResolvedValue(1);
      mockPrisma.warning.create.mockResolvedValue({
        id: 'w-2',
        strike: 2,
        reason,
        createdAt: new Date('2025-01-01'),
      });

      const result = await WarningsService.issueWarning(userId, warnedById, reason);

      expect(result.warning.strike).toBe(2);
      expect(result.totalWarnings).toBe(2);
      expect(result.remainingWarnings).toBe(1);
      expect(result.autoBanned).toBe(false);
    });

    it('auto-bans user on 3rd strike', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, username: 'testuser', status: 'ACTIVE' });
      mockPrisma.warning.count.mockResolvedValue(2);
      mockPrisma.warning.create.mockResolvedValue({
        id: 'w-3',
        strike: 3,
        reason,
        createdAt: new Date('2025-01-01'),
      });

      const result = await WarningsService.issueWarning(userId, warnedById, reason);

      expect(result.autoBanned).toBe(true);
      expect(result.warning.strike).toBe(3);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { status: 'BANNED' },
      });
    });

    it('sends notification on warning', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, username: 'testuser', status: 'ACTIVE' });
      mockPrisma.warning.count.mockResolvedValue(0);
      mockPrisma.warning.create.mockResolvedValue({
        id: 'w-1',
        strike: 1,
        reason,
        createdAt: new Date('2025-01-01'),
      });

      await WarningsService.issueWarning(userId, warnedById, reason);

      // Prisma.create uses { data: {...} } wrapper
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          type: 'WARNING',
          title: expect.stringContaining('Advertencia'),
        }),
      });
    });

    it('logs admin action', async () => {
      const mockCreateAdminLog = (await import('../admin/admin.repository')).createAdminLog;
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, username: 'testuser', status: 'ACTIVE' });
      mockPrisma.warning.count.mockResolvedValue(0);
      mockPrisma.warning.create.mockResolvedValue({
        id: 'w-1',
        strike: 1,
        reason,
        createdAt: new Date('2025-01-01'),
      });

      await WarningsService.issueWarning(userId, warnedById, reason);

      expect(mockCreateAdminLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: warnedById,
          action: 'ISSUE_WARNING',
        })
      );
    });
  });

  // ── getUserWarnings ────────────────────────────
  describe('getUserWarnings', () => {
    it('returns warning history with issuer info', async () => {
      const mockWarnings = [
        {
          id: 'w-1',
          reason: 'Spam',
          strike: 1,
          autoBanned: false,
          warner: { id: 'admin-1', username: 'Admin1' },
          createdAt: new Date('2025-01-01'),
        },
        {
          id: 'w-2',
          reason: 'Toxic behavior',
          strike: 2,
          autoBanned: false,
          warner: { id: 'admin-1', username: 'Admin1' },
          createdAt: new Date('2025-01-02'),
        },
      ];
      mockPrisma.warning.findMany.mockResolvedValue(mockWarnings);

      const warnings = await WarningsService.getUserWarnings('user-1');

      expect(warnings).toHaveLength(2);
      expect(warnings[0].reason).toBe('Spam');
      expect(warnings[0].issuedBy).toBe('Admin1');
      expect(warnings[1].reason).toBe('Toxic behavior');
    });

    it('returns empty array when user has no warnings', async () => {
      mockPrisma.warning.findMany.mockResolvedValue([]);

      const warnings = await WarningsService.getUserWarnings('user-1');
      expect(warnings).toEqual([]);
    });
  });

  // ── listWarnings ───────────────────────────────
  describe('listWarnings', () => {
    it('returns paginated warnings with metadata', async () => {
      const mockWarnings = Array.from({ length: 2 }, (_, i) => ({
        id: `w-${i + 1}`,
        reason: `Reason ${i + 1}`,
        strike: i + 1,
        autoBanned: false,
        warnedUser: { id: 'user-1', username: 'testuser' },
        warner: { id: 'admin-1', username: 'Admin1' },
        createdAt: new Date('2025-01-01'),
      }));

      mockPrisma.warning.findMany.mockResolvedValue(mockWarnings);
      mockPrisma.warning.count.mockResolvedValue(2);

      const result = await WarningsService.listWarnings(1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  // ── deleteChatMessage ──────────────────────────
  describe('deleteChatMessage', () => {
    it('deletes global chat message when user is the owner', async () => {
      mockPrisma.chatMessage.findUnique.mockResolvedValue({
        id: 'msg-1',
        userId: 'user-1',
        content: 'Hello',
      });

      await WarningsService.deleteChatMessage('msg-1', 'global', 'user-1');

      expect(mockPrisma.chatMessage.delete).toHaveBeenCalledWith({ where: { id: 'msg-1' } });
    });

    it('deletes global chat message when user is admin', async () => {
      mockPrisma.chatMessage.findUnique.mockResolvedValue({
        id: 'msg-1',
        userId: 'other-user',
        content: 'Hello',
      });
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      await WarningsService.deleteChatMessage('msg-1', 'global', 'admin-1');

      expect(mockPrisma.chatMessage.delete).toHaveBeenCalledWith({ where: { id: 'msg-1' } });
    });

    it('throws when non-admin tries to delete another user\'s message', async () => {
      mockPrisma.chatMessage.findUnique.mockResolvedValue({
        id: 'msg-1',
        userId: 'other-user',
        content: 'Hello',
      });
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'USER' });

      await expect(
        WarningsService.deleteChatMessage('msg-1', 'global', 'user-2')
      ).rejects.toThrow('No tienes permiso');
    });

    it('deletes DM when user is sender or receiver', async () => {
      mockPrisma.directMessage.findUnique.mockResolvedValue({
        id: 'dm-1',
        senderId: 'user-1',
        receiverId: 'user-2',
        content: 'Hi',
      });

      await WarningsService.deleteChatMessage('dm-1', 'dm', 'user-1');
      expect(mockPrisma.directMessage.delete).toHaveBeenCalledWith({ where: { id: 'dm-1' } });
    });

    it('throws for invalid message type', async () => {
      await expect(
        WarningsService.deleteChatMessage('msg-1', 'invalid_type' as any, 'admin-1')
      ).rejects.toThrow('Tipo de mensaje inválido');
    });
  });

  // ── deleteFeedPost ─────────────────────────────
  describe('deleteFeedPost', () => {
    it('throws when user is not admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'USER' });

      await expect(
        WarningsService.deleteFeedPost('post-1', 'user-1')
      ).rejects.toThrow('No tienes permiso');
    });

    it('throws when post does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
      mockPrisma.post.findUnique.mockResolvedValue(null);

      await expect(
        WarningsService.deleteFeedPost('nonexistent', 'admin-1')
      ).rejects.toThrow('Publicación no encontrada');
    });

    it('deletes post and logs admin action when user is admin', async () => {
      const mockCreateAdminLog = (await import('../admin/admin.repository')).createAdminLog;
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'post-1', userId: 'poster-1', content: 'test' });

      await WarningsService.deleteFeedPost('post-1', 'admin-1');

      expect(mockPrisma.post.delete).toHaveBeenCalledWith({ where: { id: 'post-1' } });
      expect(mockCreateAdminLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DELETE_POST_ADMIN',
        })
      );
    });
  });
});
