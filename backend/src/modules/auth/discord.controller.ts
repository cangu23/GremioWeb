import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import * as DiscordService from './discord.service';
import { linkDiscordAccount } from '../ecosystem/discord-link.service';
import { getRefreshCookieOptions } from './auth.controller';
import env from '../../config/env';

const DISCORD_AUTH_URL = 'https://discord.com/api/oauth2/authorize';

/**
 * Get the Discord callback URI consistently
 */
const getRedirectUri = () => `${env.BACKEND_URL}/api/auth/discord/callback`;
const getConnectRedirectUri = () => `${env.BACKEND_URL}/api/auth/discord/connect/callback`;

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

  if (req.query.ref) {
    res.cookie('discord_oauth_ref', String(req.query.ref).slice(0, 50), {
      httpOnly: true,
      secure: isSecure,
      sameSite: (isSecure ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
      maxAge: 10 * 60 * 1000,
    });
  }

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
    const ref = req.cookies?.discord_oauth_ref;

    // Limpiar las cookies de estado inmediatamente tras la lectura
    res.clearCookie('discord_oauth_state', { path: '/' });
    if (ref) res.clearCookie('discord_oauth_ref', { path: '/' });

    if (error || !code) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=discord_auth_cancelled`);
    }

    if (!state || !storedState || state !== storedState) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=${encodeURIComponent('Error de validación CSRF en Discord (state inválido)')}`);
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress;
    const authResponse = await DiscordService.authenticateWithDiscord(code as string, getRedirectUri(), ref, clientIp);

    // Set refresh token using unified secure cookie options
    res.cookie('refreshToken', authResponse.refreshToken, getRefreshCookieOptions(req));

    res.redirect(`${env.FRONTEND_URL}/dashboard`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error de autenticación';
    res.redirect(`${env.FRONTEND_URL}/login?error=${encodeURIComponent(message)}`);
  }
};

/**
 * Redirige al usuario logueado a autorizar la vinculación de su Discord desde /settings
 */
export const redirectToDiscordConnect = (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.redirect(`${env.FRONTEND_URL}/login?error=Debes+iniciar+sesion`);
  }
  if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) {
    return res.redirect(`${env.FRONTEND_URL}/settings?error=Discord+no+configurado`);
  }

  const state = crypto.randomBytes(32).toString('hex');
  const isProduction = process.env.NODE_ENV === 'production';
  const isSecure = isProduction || req.secure || req.headers['x-forwarded-proto'] === 'https';

  res.cookie('discord_connect_state', JSON.stringify({ state, userId }), {
    httpOnly: true,
    secure: isSecure,
    sameSite: (isSecure ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    maxAge: 10 * 60 * 1000,
  });

  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: getConnectRedirectUri(),
    response_type: 'code',
    scope: 'identify',
    prompt: 'consent',
    state,
  });

  res.redirect(`${DISCORD_AUTH_URL}?${params.toString()}`);
};

/**
 * Procesa el callback de vinculación y guarda la cuenta de Discord
 */
export const handleDiscordConnectCallback = async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;
    const rawState = req.cookies?.discord_connect_state;
    res.clearCookie('discord_connect_state', { path: '/' });

    if (error || !code) {
      return res.redirect(`${env.FRONTEND_URL}/settings?error=discord_connect_cancelled`);
    }

    if (!rawState) {
      return res.redirect(`${env.FRONTEND_URL}/settings?error=state_missing`);
    }

    let parsedState: { state: string; userId: string };
    try {
      parsedState = JSON.parse(rawState);
    } catch {
      return res.redirect(`${env.FRONTEND_URL}/settings?error=state_invalid`);
    }

    if (!state || state !== parsedState.state || !parsedState.userId) {
      return res.redirect(`${env.FRONTEND_URL}/settings?error=state_mismatch`);
    }

    // Obtener datos del usuario de Discord
    const tokenData = await DiscordService.exchangeCode(code as string, getConnectRedirectUri());
    const discordUser = await DiscordService.fetchDiscordUser(tokenData.access_token);

    // Guardar vinculación y otorgar bono
    await linkDiscordAccount(parsedState.userId, discordUser.discordId, discordUser.username);

    return res.redirect(`${env.FRONTEND_URL}/settings?discord_connected=true`);
  } catch (err: any) {
    console.error('Error in handleDiscordConnectCallback:', err);
    return res.redirect(`${env.FRONTEND_URL}/settings?error=${encodeURIComponent(err.message || 'Error al conectar')}`);
  }
};
