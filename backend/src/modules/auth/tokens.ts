import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import env from '../../config/env';

export const generateTokens = (userId: string, username?: string) => {
  // username goes into the token payload so real-time features (socket logs,
  // typing indicators, DM sender fallback) don't see "undefined".
  const payload = { userId, username };
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
  return { accessToken, refreshToken };
};

export const hashToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
