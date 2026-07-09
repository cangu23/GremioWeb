import prisma from '../../database/prisma';

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

export const createNotification = (data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  referenceId?: string;
}) =>
  prisma.notification.create({ data });

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
