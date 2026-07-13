import { Request, Response, NextFunction } from 'express';
import * as AuthService from './auth.service';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken, ...authResponse } = await AuthService.login(req.body);
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

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
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

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
    res.clearCookie('refreshToken');
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
      // Return 200 with null accessToken instead of 401
      // to avoid console noise for unauthenticated users
      return res.status(200).json({ accessToken: null });
    }

    const tokens = await AuthService.refreshAccessToken({ refreshToken });
    
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({ accessToken: tokens.accessToken });
  } catch (error) {
    // Log the error server-side for debugging
    console.error('[REQ] Refresh token error:', error instanceof Error ? error.message : error);
    // Return null accessToken — the frontend handles this gracefully
    return res.status(200).json({ accessToken: null });
  }
};