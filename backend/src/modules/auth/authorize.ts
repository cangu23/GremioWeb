import { Request, Response, NextFunction } from 'express';
import { Role } from '@gremio-estelar/shared';
import AppError from '../../errors/AppError';

// God mode: ADMIN/OWNER/SYSADMIN pasan cualquier chequeo de autorización,
// igual que hasAnyRole() en @gremio-estelar/shared. Sin esto, un OWNER o
// SYSADMIN (que el frontend sí deja entrar al panel) recibía 403 en TODA la
// API admin (verificar usuarios, borrar cuentas, etc.).
const GOD_ROLES = ['ADMIN', 'OWNER', 'SYSADMIN'];

export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new AppError('Authentication is required for authorization.', 401)
      );
    }

    const userRoles = req.user.role ? req.user.role.split(',').map(r => r.trim().toUpperCase()) : ['USER'];
    const hasGodMode = userRoles.some(r => GOD_ROLES.includes(r));
    const hasAccess = hasGodMode || allowedRoles.some(role => userRoles.includes(role.toUpperCase()));

    if (!hasAccess) {
      return next(new AppError('Forbidden: Insufficient permissions.', 403));
    }

    next();
  };
};
