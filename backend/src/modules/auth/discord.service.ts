import { AuthProvider, Role } from '@gremio-estelar/shared';
import * as UserRepository from '../users/user.repository';
import * as AuthRepository from './auth.repository';
import AppError from '../../errors/AppError';
import env from '../../config/env';
import { prisma } from '../../database/index';
import { generateTokens, hashToken } from './tokens';

const DISCORD_API = 'https://discord.com/api/v10';

/**
 * Exchange authorization code for Discord tokens
 */
const exchangeCode = async (code: string, redirectUri: string) => {
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    client_secret: env.DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    scope: 'identify email',
  });

  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new AppError(`Error al conectar con Discord: ${err}`, 401);
  }

  const data = await res.json();
  return data as { access_token: string; refresh_token?: string };
};

/**
 * Fetch Discord user info
 */
const fetchDiscordUser = async (accessToken: string) => {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new AppError('Error al obtener datos de Discord', 401);

  const user = await res.json() as {
    id: string;
    username: string;
    email?: string;
    avatar?: string;
    discriminator?: string;
    global_name?: string;
  };

  return {
    discordId: user.id,
    // Keep the raw @username AND the display name separate:
    // the display name is the friendly one we prefer for the account username.
    username: user.username,
    displayName: user.global_name,
    email: user.email || `${user.id}@discord.local`,
    avatarUrl: user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : '',
  };
};

/**
 * Build a safe, readable username from a Discord profile.
 * - Prefers the display name (global_name), falls back to the raw @username.
 * - Strips diacritics (á → a), replaces unsafe chars with `_`, collapses
 *   repeated underscores and trims them.
 * - If nothing usable remains (e.g. emoji-only or non-Latin @username),
 *   returns a generic `usuarioXXXX` so accounts never end up with a wall
 *   of underscores like "____________________".
 */
function buildUsernameFromDiscord(discordUser: { username: string; displayName?: string | null }): string {
  const raw = (discordUser.displayName || discordUser.username || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .trim();

  const clean = raw
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 20);

  if (!clean || /^_+$/.test(clean)) {
    return `usuario${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return clean;
}

/**
 * Authenticate or register a user with Discord
 */
export const authenticateWithDiscord = async (code: string, redirectUri: string) => {
  // 1. Exchange code for token
  const tokenData = await exchangeCode(code, redirectUri);

  // 2. Fetch Discord user info
  const discordUser = await fetchDiscordUser(tokenData.access_token);

  // 3. Check if user already exists with this email
  const existingUser = await prisma.user.findUnique({
    where: { email: discordUser.email },
    include: { vtuberProfile: true },
  });

  if (existingUser) {
    if (existingUser.provider !== AuthProvider.DISCORD && existingUser.provider !== AuthProvider.EMAIL) {
      throw new AppError('Este email ya está registrado con otro método de autenticación', 409);
    }
    if (existingUser.status !== 'ACTIVE') {
      throw new AppError(`La cuenta está ${existingUser.status.toLowerCase()}. Contacta a soporte.`, 403);
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(existingUser.id, existingUser.username);

    const hashedRefreshToken = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días
    await AuthRepository.createRefreshToken(hashedRefreshToken, existingUser.id, expiresAt);

    const { password, ...sessionUser } = existingUser;
    return { accessToken, refreshToken, user: sessionUser };
  }

  // 4. Create new user — build a readable username from the Discord profile.
  let username = buildUsernameFromDiscord(discordUser);
  const baseUsername = username;
  for (let attempt = 0; attempt < 5; attempt++) {
    const existingUsername = await UserRepository.findByUsername(username);
    if (!existingUsername) break;
    // Base name taken → retry with a random 4-digit suffix (max 20 chars).
    username = `${baseUsername.slice(0, 16)}${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const newUser = await UserRepository.createUser({
    email: discordUser.email,
    username,
    password: null,
    provider: AuthProvider.DISCORD,
    status: 'ACTIVE',
    role: Role.USER,
  });

  // ── NOTA: NO crear VTuberProfile aquí ──
  // Los usuarios registrados con Discord deben ser role USER sin perfil VTuber.
  // Solo quienes apliquen y sean aprobados recibirán un VTuberProfile.

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(newUser.id, newUser.username);

  const hashedRefreshToken = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días
  await AuthRepository.createRefreshToken(hashedRefreshToken, newUser.id, expiresAt);

  const fullUser = await prisma.user.findUnique({
    where: { id: newUser.id },
    include: { vtuberProfile: true },
  });

  const { password, ...sessionUser } = fullUser!;
  return { accessToken, refreshToken, user: sessionUser };
};
