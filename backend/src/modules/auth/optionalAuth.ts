import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../../config/env';
import * as UserRepository from '../users/user.repository';

interface JwtPayload {
  userId: string;
}

/**
 * Middleware that optionally authenticates a user.
 * If a valid Bearer token is provided, it sets req.user.
 * If no token or invalid token, it continues without error.
 * Useful for public routes that optionally show user-specific data.
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    const user = await UserRepository.findById(decoded.userId);
    if (user) {
      req.user = user;
    }
  } catch {
    // Invalid or expired token, just continue without user
  }

  next();
};
