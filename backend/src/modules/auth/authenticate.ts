import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import AppError from '../../errors/AppError';
import env from '../../config/env';
import * as UserRepository from '../../modules/users/user.repository';

interface JwtPayload {
  userId: string;
}

// ─── Cache en memoria con TTL (30s) para evitar tormentas de queries en DB ───
// Los clientes hacen polling frecuente (/dm/unread-count, /notifications, etc.).
// Cachear el usuario por 30 segundos reduce las consultas repetitivas a la base
// de datos en más de un 80% manteniendo una respuesta casi instantánea.
interface CachedAuthUser {
  user: any;
  cachedAt: number;
}
const authUserCache = new Map<string, CachedAuthUser>();
const AUTH_CACHE_TTL_MS = 30_000;

export const invalidateUserAuthCache = (userId: string) => {
  authUserCache.delete(userId);
};

const getCachedUser = async (userId: string) => {
  const now = Date.now();
  const cached = authUserCache.get(userId);
  if (cached && now - cached.cachedAt < AUTH_CACHE_TTL_MS) {
    return cached.user;
  }
  const user = await UserRepository.findById(userId);
  if (user) {
    authUserCache.set(userId, { user, cachedAt: now });
    // Limitar tamaño del mapa para evitar fugas de memoria
    if (authUserCache.size > 2000) {
      const oldestKey = authUserCache.keys().next().value;
      if (oldestKey) authUserCache.delete(oldestKey);
    }
  } else {
    authUserCache.delete(userId);
  }
  return user;
};

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token is required.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    const user = await getCachedUser(decoded.userId);
    if (!user) {
      throw new AppError('User for this token does not exist.', 401);
    }

    // Suspended/banned users must not be able to keep using the API with a
    // still-valid access token (the same gate already exists at login).
    if (user.status !== 'ACTIVE') {
      throw new AppError('La cuenta está suspendida o baneada. Contacta a soporte.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(new AppError('Invalid or expired token.', 401));
  }
};

/**
 * Optional auth: attaches req.user when a valid Bearer token is present,
 * but never blocks the request. Used by public-but-personalized endpoints
 * (e.g. sticker picker) so the plan gate is derived from the real user
 * instead of spoofable query params.
 */
export const authenticateOptional = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
      const user = await getCachedUser(decoded.userId);
      if (user && user.status === 'ACTIVE') {
        req.user = user;
      }
    }
  } catch {
    // Invalid/expired token: continue as anonymous
  }
  next();
};
