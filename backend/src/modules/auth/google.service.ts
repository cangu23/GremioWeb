import { OAuth2Client } from 'google-auth-library';
import { AuthProvider, Role } from '@gremio-estelar/shared';
import * as UserRepository from '../users/user.repository';
import * as AuthRepository from './auth.repository';
import AppError from '../../errors/AppError';
import env from '../../config/env';
import { prisma } from '../../database/index';
import { generateTokens, hashToken } from './tokens';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

interface GoogleTokenPayload {
  sub: string;
  email: string;
  name: string;
  picture: string;
  given_name?: string;
}

/**
 * Verify a Google ID token and return the payload
 */
const verifyGoogleToken = async (credential: string): Promise<GoogleTokenPayload> => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new AppError('Token de Google inválido', 401);
    }

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name || payload.given_name || payload.email.split('@')[0],
      picture: payload.picture || '',
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Error al verificar token de Google', 401);
  }
};

/**
 * Find or create a VTuber profile for a user
 */
const getOrCreateVtuberProfile = async (userId: string, displayName: string, avatarUrl: string) => {
  const existing = await prisma.vTuberProfile.findUnique({ where: { userId } });
  if (existing) {
    // ⚠️ Only update displayName, NOT the avatar — user may have customized it
    return existing;
  }
  // Create new profile
  return prisma.vTuberProfile.create({
    data: {
      userId,
      displayName,
      avatarUrl: avatarUrl || null,
      description: 'Miembro de Gremio Estelar — Conectado con Google',
    },
  });
};

/**
 * Authenticate or register a user with Google
 */
export const authenticateWithGoogle = async (credential: string) => {
  // 1. Verify the Google token
  const googleUser = await verifyGoogleToken(credential);

  // 2. Check if user already exists with this email (include vtuberProfile)
  const existingUser = await prisma.user.findUnique({
    where: { email: googleUser.email },
    include: { vtuberProfile: true },
  });

  if (existingUser) {
    // User exists — validate
    if (existingUser.provider !== AuthProvider.GOOGLE && existingUser.provider !== AuthProvider.EMAIL) {
      throw new AppError('Este email ya está registrado con otro método de autenticación', 409);
    }
    if (existingUser.status !== 'ACTIVE') {
      throw new AppError(`La cuenta está ${existingUser.status.toLowerCase()}. Contacta a soporte.`, 403);
    }

    // Don't update avatar on re-login — user may have customized it

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(existingUser.id);

    // Persist refresh token
    const hashedRefreshToken = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await AuthRepository.createRefreshToken(hashedRefreshToken, existingUser.id, expiresAt);

    // Return user data (without password)
    const { password, ...sessionUser } = existingUser;

    return { accessToken, refreshToken, user: sessionUser };
  }

  // 3. Create new user from Google data
  let username = googleUser.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 20);

  // Check if username is taken
  const existingUsername = await UserRepository.findByUsername(username);
  if (existingUsername) {
    username = `${username}${Math.floor(Math.random() * 10000)}`;
  }

  const newUser = await UserRepository.createUser({
    email: googleUser.email,
    username,
    password: null,
    provider: AuthProvider.GOOGLE,
    status: 'ACTIVE',
    role: Role.USER,
  });

  // Create VTuber profile with Google data
  await getOrCreateVtuberProfile(newUser.id, googleUser.name, googleUser.picture);

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(newUser.id);

  // Persist refresh token
  const hashedRefreshToken = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await AuthRepository.createRefreshToken(hashedRefreshToken, newUser.id, expiresAt);

  // Fetch full user with profile
  const fullUser = await prisma.user.findUnique({
    where: { id: newUser.id },
    include: { vtuberProfile: true },
  });

  const { password, ...sessionUser } = fullUser!;

  return {
    accessToken,
    refreshToken,
    user: sessionUser,
  };
};
