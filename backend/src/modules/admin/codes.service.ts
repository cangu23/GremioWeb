import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../../database';
import * as CodesRepository from './codes.repository';
import * as AdminRepository from './admin.repository';
import AppError from '../../errors/AppError';

const CODE_EXPIRY_DAYS = 30;

/**
 * Generate a secure random code
 */
const generateSecureCode = (): string => {
  const prefix = 'GC-'; // Gremio Code
  const random = crypto.randomBytes(12).toString('hex').toUpperCase();
  return `${prefix}${random}`;
};

/**
 * Hash a code for secure storage (one-way, like passwords)
 */
const hashCode = async (code: string): Promise<string> => {
  return bcrypt.hash(code, 10);
};

/**
 * Verify a code against its hash
 */
export const verifyCode = async (code: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(code, hash);
};

/**
 * Generate a new role invitation code
 */
export const generateCode = async (data: {
  name: string;
  role: string;
  generatedById: string;
}) => {
  const validRoles = ['VTUBER', 'MAID', 'MODERATOR', 'ADMIN'];
  if (!validRoles.includes(data.role)) {
    throw new AppError(`Rol inválido. Debe ser: ${validRoles.join(', ')}`, 400);
  }

  // Generate the raw code (shown to user only once)
  const rawCode = generateSecureCode();

  // Hash it for storage (one-way encryption)
  const hashed = await hashCode(rawCode);

  // Set expiry date (30 days from now)
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await CodesRepository.createCode({
    code: hashed,
    name: data.name,
    role: data.role,
    generatedById: data.generatedById,
    expiresAt,
  });

  return {
    rawCode,      // ← This is the only time the raw code is shown!
    name: data.name,
    role: data.role,
    expiresAt,
  };
};

/**
 * List codes with pagination and filters
 */
export const listCodes = async (query: {
  page: number;
  limit: number;
  status?: string;
  role?: string;
  search?: string;
}) => {
  const { page, limit, skip } = { page: query.page, limit: query.limit, skip: (query.page - 1) * query.limit };

  const [data, total] = await Promise.all([
    CodesRepository.findCodes({ skip, take: limit, status: query.status, role: query.role, search: query.search }),
    CodesRepository.countCodes({ status: query.status, role: query.role, search: query.search }),
  ]);

  // Sanitize - never expose the hash
  const sanitized = data.map(({ code, ...rest }) => rest);

  return {
    data: sanitized,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Revoke a code so it can no longer be used
 */
export const revokeCode = async (id: string) => {
  const code = await CodesRepository.findCodeById(id);
  if (!code) throw new AppError('Código no encontrado', 404);
  if (code.status !== 'ACTIVE') throw new AppError('El código ya no está activo', 400);

  await CodesRepository.updateCode(id, { status: 'REVOKED' });
  return { message: 'Código revocado exitosamente' };
};

/**
 * Redeem a code to upgrade the user's role
 */
export const redeemCode = async (rawCode: string, userId: string) => {
  // Get all active codes (we need to find which one matches)
  // In production, we'd use a bloom filter or similar,
  // but for this scale we iterate active codes
  const allCodes = await CodesRepository.findCodes({
    skip: 0,
    take: 1000,
    status: 'ACTIVE',
  });

  // Find the matching code by comparing against hashes
  let matchedCode = null;
  for (const stored of allCodes) {
    const isValid = await verifyCode(rawCode, stored.code);
    if (isValid) {
      matchedCode = stored;
      break;
    }
  }

  if (!matchedCode) {
    throw new AppError('Código inválido o expirado', 404);
  }

  // Check if user already has this role
  const currentUser = await AdminRepository.findUserById(userId);
  if (currentUser && currentUser.role === matchedCode.role) {
    throw new AppError(`Ya tienes el rol ${matchedCode.role}`, 400);
  }

  // Check if expired
  if (matchedCode.expiresAt && new Date() > matchedCode.expiresAt) {
    await CodesRepository.updateCode(matchedCode.id, { status: 'EXPIRED' });
    throw new AppError('El código ha expirado', 410);
  }

  // Update code as used (using scalar field name)
  await prisma.roleCode.update({
    where: { id: matchedCode.id },
    data: {
      status: 'USED',
      usedById: userId,
      usedAt: new Date(),
    },
  });

  // Update user's role
  const updatedUser = await AdminRepository.updateUser(userId, {
    role: matchedCode.role,
  });

  // If redeemed role is VTUBER, ensure vTuberProfile is created and approved automatically
  if (matchedCode.role === 'VTUBER') {
    await prisma.vTuberProfile.upsert({
      where: { userId },
      create: {
        userId,
        displayName: currentUser?.displayName || currentUser?.username || 'VTuber',
        avatarUrl: currentUser?.avatarUrl || null,
        isApproved: true,
        isVerified: true,
        isHidden: false,
      },
      update: {
        isApproved: true,
        isVerified: true,
        isHidden: false,
      },
    });
  }

  // Log admin action
  await AdminRepository.createAdminLog({
    userId: matchedCode.generatedById,
    action: 'CODE_REDEEMED',
    detail: JSON.stringify({
      codeName: matchedCode.name,
      codeRole: matchedCode.role,
      redeemedByUserId: userId,
    }),
  });

  return {
    message: `¡Código canjeado exitosamente! Ahora eres ${matchedCode.role}`,
    newRole: matchedCode.role,
    codeName: matchedCode.name,
    user: updatedUser,
  };
};
