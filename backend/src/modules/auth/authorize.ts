import { Request, Response, NextFunction } from 'express';
import { Role } from '@gremio-estelar/shared';
import AppError from '../../errors/AppError';

export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new AppError('Authentication is required for authorization.', 401)
      );
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      return next(new AppError('Forbidden: Insufficient permissions.', 403));
    }

    next();
  };
};
