import { Request, Response, NextFunction } from 'express';
import * as NotificationsService from './notifications.service';

export const getMyNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const page = Math.max(1, Number(req.query.page) || 1);
    const skip = (page - 1) * limit;
    const notifications = await NotificationsService.getMyNotifications(req.user!.id, limit, skip);
    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await NotificationsService.getUnreadCount(req.user!.id);
    res.json({ count });
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await NotificationsService.markAsRead(String(req.params.id), req.user!.id);
    if (!result) {
      res.status(404).json({ message: 'Notificación no encontrada' });
      return;
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await NotificationsService.markAllAsRead(req.user!.id);
    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (err) {
    next(err);
  }
};
