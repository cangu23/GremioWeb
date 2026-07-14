import { ioContext } from '../../websocket/socket.server';
import type { Notification } from '@prisma/client';

/**
 * Emit a notification to the user's personal Socket.IO room.
 * Safe to call even if the socket server hasn't started yet
 * (ioContext.instance will be null until createSocketServer is called).
 * Uses ioContext (mutable object ref) to work correctly with CommonJS.
 */
export const emitNotification = (notification: Notification) => {
  try {
    if (!ioContext.instance) return; // Socket server not yet initialized

    ioContext.instance.to(`user:${notification.userId}`).emit('notification:new', {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      referenceId: notification.referenceId,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('[emitNotification] Error:', (err as Error)?.message);
  }
};
