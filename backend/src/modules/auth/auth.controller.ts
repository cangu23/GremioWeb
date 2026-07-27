import { Request, Response, NextFunction } from 'express';
import * as AuthService from './auth.service';

// 30 days in milliseconds
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

const getRefreshCookieOptions = (req: Request) => {
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
    await AuthService.register(req.body);
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