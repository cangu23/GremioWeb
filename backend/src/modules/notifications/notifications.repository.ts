import prisma from '../../database/prisma';
import { io } from '../../websocket/socket.server';

export const findNotificationsByUser = (userId: string, limit = 50) =>
  prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

export const countUnreadNotifications = (userId: string) =>
  prisma.notification.count({
    where: { userId, read: false },
  });

export const findNotificationById = (id: string) =>
  prisma.notification.findUnique({ where: { id } });

export const createNotification = async (data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  referenceId?: string;
}) => {
  const notification = await prisma.notification.create({ data });

  // Emit real-time notification via Socket.IO to the user's personal room
  try {
    if (io) {
      io.to(`user:${notification.userId}`).emit('notification:new', {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        referenceId: notification.referenceId,
        read: notification.read,
        createdAt: notification.createdAt.toISOString(),
      });
    }
  } catch (err) {
    console.error('[Socket] Error emitting notification:', err);
  }

  return notification;
};

export const markAsRead = (id: string) =>
  prisma.notification.update({
    where: { id },
    data: { read: true },
  });

export const markAllAsRead = (userId: string) =>
  prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
