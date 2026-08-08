import { Request, Response, NextFunction } from 'express';
import * as UserService from './user.service';
import * as ProfileStatsService from './profile-stats.service';
import { hasAnyRole } from '@gremio-estelar/shared';

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const profile = await UserService.getMe(userId);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const updatedProfile = await UserService.updateMe(userId, req.body);
    res.status(200).json(updatedProfile);
  } catch (error) {
    next(error);
  }
};

export const getPublicUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const publicProfile = await UserService.getPublicUser(id);
    // Estadísticas avanzadas de visualización: registrar la visita (NOVA+ puede verlas)
    ProfileStatsService.recordProfileView(id, req.user?.id).catch(() => {});
    res.status(200).json(publicProfile);
  } catch (error) {
    next(error);
  }
};

export const getProfileStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const stats = await ProfileStatsService.getProfileStats(req.user!.id, id);
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

export const getUsersByRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = String(req.params.role || '').toUpperCase();
    // Roles administrativos solo los puede consultar un ADMIN
    const sensitiveRoles = ['ADMIN', 'MODERATOR'];
    if (sensitiveRoles.includes(role) && !hasAnyRole(req.user?.role, ['ADMIN', 'OWNER'])) {
      return res.status(403).json({ message: 'No tienes permiso para ver este listado.' });
    }
    const users = await UserService.getUsersByRole(role);
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const searchUsersForMention = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = String(req.query.q || '');
    const users = await UserService.searchUsersForMention(q);
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const searchUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = String(req.query.q || '');
    const users = await UserService.searchUsers(q);
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const deleteMyAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await UserService.deleteMyAccount(req.user!.id);
    // Invalidar la sesión también en el servidor: la fila del refresh token ya
    // se borró en cascada, pero limpiamos la cookie para que el cierre de sesión
    // sea inmediato aunque el cliente se interrumpa antes del logout.
    const isProduction = process.env.NODE_ENV === 'production';
    const isSecure = isProduction || req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax',
      path: '/',
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { note, durationHours, noteColor } = req.body;
    const result = await UserService.updateNote(userId, note, durationHours, noteColor);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
