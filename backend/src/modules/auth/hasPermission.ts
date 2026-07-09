import { Request, Response, NextFunction } from 'express';
import AppError from '../../errors/AppError';
import { checkPermission, Permission } from '../auth/permissions';
import { Role } from '@gremio-estelar/shared';

export const hasPermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new AppError('Authentication is required for authorization.', 401)
      );
    }

    const hasPerm = checkPermission(req.user.role as Role, permission);

    if (!hasPerm) {
      return next(new AppError('Forbidden: Insufficient permissions.', 403));
    }

    next();
  };
};