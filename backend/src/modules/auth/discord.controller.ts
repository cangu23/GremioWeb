import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import * as DiscordService from './discord.service';
import { getRefreshCookieOptions } from './auth.controller';
import env from '../../config/env';

const DISCORD_AUTH_URL = 'https://discord.com/api/oauth2/authorize';

/**
 * Get the Discord callback URI consistently
 */
const getRedirectUri = () => `${env.BACKEND_URL}/api/auth/discord/callback`;

/**
 * Redirect user to Discord OAuth consent page with CSRF state verification
 */
export const redirectToDiscord = (req: Request, res: Response) => {
  // Validate Discord OAuth is configured
  if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) {
    return res.redirect(`${env.FRONTEND_URL}/login?error=Discord+no+configurado`);
  }

  // Generar un state criptográfico aleatorio contra ataques CSRF
  const state = crypto.randomBytes(32).toString('hex');
  const isProduction = process.env.NODE_ENV === 'production';
  const isSecure = isProduction || req.secure || req.headers['x-forwarded-proto'] === 'https';

  res.cookie('discord_oauth_state', state, {
    httpOnly: true,
    secure: isSecure,
    sameSite: (isSecure ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    maxAge: 10 * 60 * 1000, // 10 minutos de validez
  });

  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: 'identify email',
    prompt: 'consent',
    state,
  });

  res.redirect(`${DISCORD_AUTH_URL}?${params.toString()}`);
};

/**
 * Handle Discord OAuth callback with CSRF state verification
 */
export const handleDiscordCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state, error } = req.query;
    const storedState = req.cookies?.discord_oauth_state;

    // Limpiar la cookie de estado inmediatamente tras la lectura
    res.clearCookie('discord_oauth_state', { path: '/' });

    if (error || !code) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=discord_auth_cancelled`);
    }

    if (!state || !storedState || state !== storedState) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=${encodeURIComponent('Error de validación CSRF en Discord (state inválido)')}`);
    }

    const authResponse = await DiscordService.authenticateWithDiscord(code as string, getRedirectUri());

    // Set refresh token using unified secure cookie options
    res.cookie('refreshToken', authResponse.refreshToken, getRefreshCookieOptions(req));

    res.redirect(`${env.FRONTEND_URL}/dashboard`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error de autenticación';
    res.redirect(`${env.FRONTEND_URL}/login?error=${encodeURIComponent(message)}`);
  }
};
