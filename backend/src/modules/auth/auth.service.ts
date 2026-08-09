import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthProvider, Role } from '@gremio-estelar/shared';
import { prisma } from '../../database/index';
import * as UserRepository from '../users/user.repository';
import * as AuthRepository from './auth.repository';
import AppError from '../../errors/AppError';
import env from '../../config/env';
import { generateTokens, hashToken } from './tokens';
import { LoginInput, RegisterInput, RefreshTokenInput } from './auth.types';
import { trackMissionProgress } from '../ecosystem/missions.service';
import { addStardust } from '../ecosystem/stardust.service';

/**
 * Registers a new user and returns the user object without tokens.
 */
export const register = async (input: RegisterInput) => {
  const existingUser = await UserRepository.findByEmail(input.email);
  if (existingUser) {
    throw new AppError('Ya existe una cuenta con este correo electrónico.', 409);
  }

  const existingUsername = await UserRepository.findByUsername(input.username);
  if (existingUsername) {
    throw new AppError('El nombre de usuario ya está en uso.', 409);
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const user = await UserRepository.createUser({
    email: input.email,
    username: input.username,
    password: hashedPassword,
    provider: AuthProvider.EMAIL,
    // For development, new users are active by default.
    status: 'ACTIVE',
    role: Role.USER, // Default role
  });

  // Handle referral tracking & reward if ref provided
  if ((input as any).ref) {
    try {
      const refClean = String((input as any).ref).trim().toLowerCase();
      const referrer = await prisma.user.findFirst({
        where: { username: { equals: refClean, mode: 'insensitive' } },
        select: { id: true, username: true },
      });

      if (referrer && referrer.id !== user.id) {
        // Track referrer's mission and grant referrer bonus
        await trackMissionProgress(referrer.id, 'INVITE_FRIEND');
        await addStardust(referrer.id, 50, 'REFERRAL_BONUS');

        // Grant new user welcome bonus for using an invite link
        await addStardust(user.id, 50, 'WELCOME_REFERRAL_BONUS');

        // Notify referrer
        await prisma.notification.create({
          data: {
            userId: referrer.id,
            type: 'referral_join',
            title: '🎉 ¡Nuevo miembro invitado!',
            message: `@${input.username} se ha unido a Gremio Estelar con tu enlace. (+50 ⭐)`,
            referenceId: user.id,
          },
        });

        // Notify new user
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'referral_welcome',
            title: '🎁 ¡Bienvenido al Gremio!',
            message: `¡Recibiste +50 ⭐ Stardust de regalo por unirte con el enlace de @${referrer.username}!`,
            referenceId: referrer.id,
          },
        }).catch(() => {});
      }
    } catch (refErr) {
      console.error('Referral processing error:', refErr);
    }
  }

  // Omit password from the returned user object
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Logs in a user, generates access and refresh tokens, and persists the refresh token.
 */
export const login = async (input: LoginInput) => {
  const user = await UserRepository.findByEmail(input.email);
  if (!user || !user.password) {
    throw new AppError('Correo electrónico o contraseña incorrectos.', 401);
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Correo electrónico o contraseña incorrectos.', 401);
  }

  if (user.status !== 'ACTIVE') {
    throw new AppError(`La cuenta está ${user.status.toLowerCase()}. Por favor contacta a soporte.`, 403);
  }

  const { accessToken, refreshToken } = generateTokens(user.id, user.username);

  // Persist the refresh token
  const hashedRefreshToken = hashToken(refreshToken);
  const expiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 días
  );

  await AuthRepository.createRefreshToken(hashedRefreshToken, user.id, expiresAt);

  // Fetch full user with creator profiles (so avatarUrl is available immediately after login)
  // Fail-open: si la tabla StreamerProfile aún no existe (P2021, migración
  // pendiente en la DB), reintenta sin ese include para no tumbar login/registro.
  const fullUser = await UserRepository.queryUserWithProfiles(prisma, user.id);

  if (!fullUser) {
    throw new AppError('User not found', 404);
  }

  // Omit password from the session user object
  const { password, ...sessionUser } = fullUser;

  return {
    accessToken,
    refreshToken,
    user: sessionUser,
  };
};

/**
 * Invalidates a user's session by deleting their refresh token.
 */
export const logout = async (input: RefreshTokenInput) => {
  const hashedToken = hashToken(input.refreshToken);
  try {
    await AuthRepository.deleteRefreshToken(hashedToken);
  } catch (error) {
    // If the token is not found, it's already invalid, so we can ignore the error.
    // This prevents leaking information about which tokens exist.
  }
};

/**
 * Issues a new access token using a valid refresh token.
 */
export const refreshAccessToken = async (input: RefreshTokenInput) => {
  // 1. Verify JWT signature
  let payload;
  try {
    payload = jwt.verify(input.refreshToken, env.JWT_REFRESH_SECRET) as {
      userId: string;
      username?: string;
    };
  } catch (error) {
    throw new AppError('Invalid or expired refresh token signature.', 401);
  }

  // 2. Hash the incoming token to look it up in the database
  const hashedToken = hashToken(input.refreshToken);

  // 3. Find the token in the database
  const dbToken = await AuthRepository.findRefreshTokenByHash(hashedToken);

  // 4. Validate the token exists and is not expired
  if (!dbToken) {
    throw new AppError('Refresh token not found. It may have been revoked.', 401);
  }
  if (new Date() > dbToken.expiresAt) {
    // As a cleanup, delete the expired token
    await AuthRepository.deleteRefreshToken(hashedToken);
    throw new AppError('Refresh token has expired.', 401);
  }

  // 4b. Enforce account status: suspended/banned users must not obtain new
  // tokens forever by rotating a stolen/old refresh token (same gate as login).
  const account = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { status: true },
  });
  if (!account) {
    await AuthRepository.deleteRefreshToken(hashedToken);
    throw new AppError('La cuenta ya no existe.', 401);
  }
  if (account.status !== 'ACTIVE') {
    // Revoke the refresh token so the user cannot keep rotating it
    await AuthRepository.deleteRefreshToken(hashedToken);
    throw new AppError('La cuenta está suspendida o baneada. Contacta a soporte.', 403);
  }

  // 5. (Security) Invalidate the used token immediately
  await AuthRepository.deleteRefreshToken(hashedToken);

  // 6. Issue a new pair of tokens (carry username so the socket doesn't show undefined)
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(
    payload.userId,
    payload.username
  );

  // 7. Persist the new refresh token
  const newHashedRefreshToken = hashToken(newRefreshToken);
  const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await AuthRepository.createRefreshToken(
    newHashedRefreshToken,
    payload.userId,
    newExpiresAt
  );

  return { accessToken, refreshToken: newRefreshToken };
};