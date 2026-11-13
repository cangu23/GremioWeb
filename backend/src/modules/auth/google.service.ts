import { OAuth2Client } from 'google-auth-library';
import { AuthProvider, Role } from '@gremio-estelar/shared';
import * as UserRepository from '../users/user.repository';
import * as AuthRepository from './auth.repository';
import AppError from '../../errors/AppError';
import env from '../../config/env';
import { prisma } from '../../database/index';
import { generateTokens, hashToken } from './tokens';
import { processReferral } from '../referrals/referral.service';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

interface GoogleTokenPayload {
  sub: string;
  email: string;
  name: string;
  picture: string;
  given_name?: string;
}

/**
 * Verify a Google ID token or Google OAuth2 access token and return the payload
 */
const verifyGoogleToken = async (credential: string): Promise<GoogleTokenPayload> => {
  // 1. Probar verificación como ID Token JWT si parece JWT
  if (credential.includes('.')) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (payload && payload.email) {
        return {
          sub: payload.sub,
          email: payload.email,
          name: payload.name || payload.given_name || payload.email.split('@')[0],
          picture: payload.picture || '',
        };
      }
    } catch {
      // Si falla como ID token, intentar como access token a continuación
    }
  }

  // 2. Probar como access_token consultando la API userinfo de Google
  try {
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${credential}` },
    });
    if (userInfoRes.ok) {
      const info = (await userInfoRes.json()) as {
        sub?: string;
        email?: string;
        name?: string;
        given_name?: string;
        picture?: string;
      };
      if (info.email && info.sub) {
        return {
          sub: info.sub,
          email: info.email,
          name: info.name || info.given_name || info.email.split('@')[0],
          picture: info.picture || '',
        };
      }
    }
  } catch {
    // Continuar al error
  }

  throw new AppError('Error al verificar credencial de Google', 401);
};

/**
 * Authenticate or register a user with Google
 */
export const authenticateWithGoogle = async (credential: string, ref?: string, clientIp?: string) => {
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
    const { accessToken, refreshToken } = generateTokens(existingUser.id, existingUser.username);

    // Persist refresh token
    const hashedRefreshToken = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días
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
    avatarUrl: googleUser.picture || null,
    password: null,
    provider: AuthProvider.GOOGLE,
    status: 'ACTIVE',
    role: Role.USER,
  });

  if (ref) {
    await processReferral(ref, newUser.id, clientIp).catch((refErr) => {
      console.error('Referral processing error in Google signup:', refErr);
    });
  }

  // ── NOTA: NO crear VTuberProfile aquí ──
  // Los usuarios registrados con Google deben ser role USER sin perfil VTuber.
  // Solo quienes apliquen y sean aprobados recibirán un VTuberProfile.

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(newUser.id, newUser.username);

  // Persist refresh token
  const hashedRefreshToken = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días
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
