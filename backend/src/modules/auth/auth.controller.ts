import { Request, Response, NextFunction } from 'express';
import { hasAnyRole } from '@gremio-estelar/shared';
import * as AuthService from './auth.service';

// 30 days in milliseconds
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

export const getRefreshCookieOptions = (req: Request) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isSecure = isProduction || req.secure || req.headers['x-forwarded-proto'] === 'https';

  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: (isSecure ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    maxAge: REFRESH_COOKIE_MAX_AGE,
  };
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken, ...authResponse } = await AuthService.login(req.body);
    
    res.cookie('refreshToken', refreshToken, getRefreshCookieOptions(req));

    res.status(200).json(authResponse);
  } catch (error) {
    next(error);
  }
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress;
    await AuthService.register(req.body, clientIp);
    const { refreshToken, ...authResponse } = await AuthService.login({
      email: req.body.email,
      password: req.body.password,
    });
    
    res.cookie('refreshToken', refreshToken, getRefreshCookieOptions(req));

    res.status(201).json(authResponse);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await AuthService.logout({ refreshToken });
    }
    const cookieOpts = getRefreshCookieOptions(req);
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: '/',
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      // No cookie = user not logged in, this is normal
      return res.status(200).json({ accessToken: null });
    }

    const tokens = await AuthService.refreshAccessToken({ refreshToken });
    
    res.cookie('refreshToken', tokens.refreshToken, getRefreshCookieOptions(req));

    res.status(200).json({ accessToken: tokens.accessToken });
  } catch (error) {
    // Token expired/revoked or server error — let the error handler manage it
    console.error('[REQ] Refresh token error:', error instanceof Error ? error.message : error);
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    const result = await AuthService.requestPasswordReset(email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, newPassword } = req.body;
    const result = await AuthService.resetPassword(token, newPassword);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const createDesktopToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'No autenticado.' });
    }

    const isCreator =
      hasAnyRole(user.role, ['VTUBER', 'STREAMER', 'PARTNER', 'STAFF', 'MODERATOR', 'MOD', 'ADMIN', 'OWNER', 'SYSADMIN']) ||
      Boolean((user as any).vtuberProfile) ||
      Boolean((user as any).streamerProfile);

    if (!isCreator) {
      return res.status(403).json({
        message: 'Acceso denegado: Estelar Forge es una herramienta exclusiva para creadores acreditados (VTubers y Streamers) del Gremio Estelar. Postúlate como creador en la plataforma para desbloquear tu acceso.',
        requiresCreatorRole: true,
      });
    }

    const token = await AuthService.generateDesktopToken(user.id, user.username, user.role);
    res.status(200).json({
      token,
      user,
      isCreator: true,
      licensedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export const verifyLicense = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false, message: 'Token de licencia requerido.' });
    }
    const token = authHeader.split(' ')[1];
    const result = await AuthService.verifyDesktopLicense(token);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};