import { Request, Response, NextFunction } from 'express';
import * as GoogleService from './google.service';
import { getRefreshCookieOptions } from './auth.controller';

export const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credential, ref } = req.body;
    if (!credential || typeof credential !== 'string') {
      return res.status(400).json({ status: 'error', message: 'Google credential is required' });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress;
    const authResponse = await GoogleService.authenticateWithGoogle(credential, ref, clientIp);

    // Set refresh token using unified secure cookie options
    res.cookie('refreshToken', authResponse.refreshToken, getRefreshCookieOptions(req));

    res.json({
      accessToken: authResponse.accessToken,
      user: authResponse.user,
    });
  } catch (err) {
    next(err);
  }
};
