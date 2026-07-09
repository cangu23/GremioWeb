import { Request, Response, NextFunction } from 'express';
import * as GoogleService from './google.service';

export const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ status: 'error', message: 'Google credential is required' });
    }

    const authResponse = await GoogleService.authenticateWithGoogle(credential);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', authResponse.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      accessToken: authResponse.accessToken,
      user: authResponse.user,
    });
  } catch (err) {
    next(err);
  }
};
