import { Request, Response, NextFunction } from 'express';
import * as DiscordService from './discord.service';
import env from '../../config/env.js';

const DISCORD_AUTH_URL = 'https://discord.com/api/oauth2/authorize';

/**
 * Get the Discord callback URI consistently
 */
const getRedirectUri = () => `${env.BACKEND_URL}/api/auth/discord/callback`;

/**
 * Redirect user to Discord OAuth consent page
 */
export const redirectToDiscord = (req: Request, res: Response) => {
  // Validate Discord OAuth is configured
  if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) {
    return res.redirect(`${env.FRONTEND_URL}/login?error=Discord+no+configurado`);
  }

  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: 'identify email',
    prompt: 'consent',
  });

  res.redirect(`${DISCORD_AUTH_URL}?${params.toString()}`);
};

/**
 * Handle Discord OAuth callback
 */
export const handleDiscordCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, error } = req.query;

    if (error || !code) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=discord_auth_cancelled`);
    }

    const authResponse = await DiscordService.authenticateWithDiscord(code as string, getRedirectUri());

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', authResponse.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${env.FRONTEND_URL}/dashboard`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error de autenticación';
    res.redirect(`${env.FRONTEND_URL}/login?error=${encodeURIComponent(message)}`);
  }
};
