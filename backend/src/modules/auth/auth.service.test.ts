import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Role, AuthProvider } from '@gremio-estelar/shared';

const mockUserRepository = vi.hoisted(() => ({
  findByEmail: vi.fn(),
  createUser: vi.fn(),
  findById: vi.fn(),
}));

const mockAuthRepository = vi.hoisted(() => ({
  createRefreshToken: vi.fn(),
  deleteRefreshToken: vi.fn(),
  findRefreshToken: vi.fn(),
  deleteUserRefreshTokens: vi.fn(),
}));

vi.mock('../users/user.repository', () => mockUserRepository);
vi.mock('./auth.repository', () => mockAuthRepository);
vi.mock('../../database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 'user-1', email: 'test@example.com', role: 'USER' }),
    },
    refreshToken: {
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import * as AuthService from './auth.service';
import bcrypt from 'bcrypt';

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('throws 409 error if email already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });

      await expect(
        AuthService.register({ email: 'test@example.com', username: 'testuser', password: 'password123' })
      ).rejects.toThrow('An account with this email already exists.');
    });

    it('hashes password and creates user', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.createUser.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        role: Role.USER,
        status: 'ACTIVE',
      });

      const user = await AuthService.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      });

      expect(user.id).toBe('user-1');
      expect((user as any).password).toBeUndefined();
      expect(mockUserRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          username: 'testuser',
          provider: AuthProvider.EMAIL,
        })
      );
    });
  });

  describe('login', () => {
    it('throws 401 for non-existent user', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(
        AuthService.login({ email: 'unknown@example.com', password: 'password123' })
      ).rejects.toThrow('Invalid email or password.');
    });

    it('throws 401 for incorrect password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: hashedPassword,
        status: 'ACTIVE',
      });

      await expect(
        AuthService.login({ email: 'test@example.com', password: 'wrongpassword' })
      ).rejects.toThrow('Invalid email or password.');
    });

    it('returns tokens and user for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: hashedPassword,
        status: 'ACTIVE',
        role: Role.USER,
      });
      mockAuthRepository.createRefreshToken.mockResolvedValue({});

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'correctpassword',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.id).toBe('user-1');
    });
  });
});
