import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import env, { isOriginAllowed } from '../config/env';
import prisma from '../database/prisma';
import * as NotificationsService from '../modules/notifications/notifications.service';
import { sanitizeMessage, isValidCuid, createSocketRateLimiter } from '../utils/sanitize';
import { hasAnyRole } from '@gremio-estelar/shared';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

/**
 * Object wrapper for the Socket.IO server instance.
 * We use an object so that CommonJS consumers get a mutable reference
 * (exports.io = value copies the value; mutating a shared object works).
 */
export const ioContext: { instance: Server | null } = { instance: null };

// Track online users per guild for real-time member status
const guildOnlineUsers = new Map<string, Set<string>>();

// Track all online users globally for real-time friend presence
const globalOnlineUsers = new Set<string>();

function addOnlineUser(guildId: string, userId: string) {
  if (!guildOnlineUsers.has(guildId)) {
    guildOnlineUsers.set(guildId, new Set());
  }
  guildOnlineUsers.get(guildId)!.add(userId);
}

function removeOnlineUser(guildId: string, userId: string) {
  const users = guildOnlineUsers.get(guildId);
  if (users) {
    users.delete(userId);
    if (users.size === 0) {
      guildOnlineUsers.delete(guildId);
    }
  }
}

function broadcastOnline(guildId: string) {
  const users = guildOnlineUsers.get(guildId);
  const onlineIds = users ? Array.from(users) : [];
  ioContext.instance?.to(`guild:${guildId}`).emit('guild:online', { onlineIds });
}

export const createSocketServer = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Socket CORS blocked: ${origin}`), false);
        }
      },
      credentials: true,
    },
  });

  // Rate limiter: max 10 messages per 5 seconds per user
  const messageLimiter = createSocketRateLimiter({ maxEvents: 10, windowMs: 5000 });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token as string, env.JWT_ACCESS_SECRET) as { userId: string; username?: string };
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      // Tokens issued before username was added to the payload lack it —
      // fall back to the DB so logs/typing indicators never show "undefined".
      if (!socket.username) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { username: true },
        });
        socket.username = user?.username;
      }
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // Store the instance for cross-module access
  ioContext.instance = io;

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const username = socket.username!;

    console.log(`[Socket] User connected: ${username} (${userId})`);

    // Join default global room
    socket.join('global');
    // Join personal room for notifications & targeted events
    socket.join(`user:${userId}`);

    // Global presence tracking
    globalOnlineUsers.add(userId);
    // Broadcast to everyone that this user came online
    socket.broadcast.emit('user:online', { userId, username });
    // Send the current online user list to the newly connected client
    socket.emit('user:online-list', { onlineIds: Array.from(globalOnlineUsers) });

    // Handle Direct Messages
    socket.on('dm:message', async (data: { receiverId: string; content: string }) => {
      // Rate limiting
      if (!messageLimiter.allow(userId)) {
        socket.emit('dm:error', { message: 'Enviando mensajes muy rápido. Espera unos segundos.' });
        return;
      }
      // Validate receiver ID
      if (!data.receiverId || !isValidCuid(data.receiverId)) return;
      // Sanitize content
      const content = sanitizeMessage(data.content, 1000);
      if (!content) return;
      if (data.receiverId === userId) return; // Can't DM self

      try {
        const message = await prisma.directMessage.create({
          data: {
            content,
            senderId: userId,
            receiverId: data.receiverId,
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                role: true,
                vtuberProfile: { select: { displayName: true, avatarUrl: true } },
                purchases: {
                  where: { equipped: true },
                  include: { item: true },
                },
              },
            },
            receiver: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                role: true,
                vtuberProfile: { select: { displayName: true, avatarUrl: true } },
                purchases: {
                  where: { equipped: true },
                  include: { item: true },
                },
              },
            },
          },
        });

        const payload = {
          id: message.id,
          content: message.content,
          read: message.read,
          createdAt: message.createdAt.toISOString(),
          senderId: message.senderId,
          receiverId: message.receiverId,
          sender: message.sender,
          receiver: message.receiver,
        };

        // Send to both users (sender gets confirmation, receiver gets new message)
        socket.emit('dm:message', payload);
        socket.to(`user:${data.receiverId}`).emit('dm:message', payload);

        // Send notification to receiver (fire & forget)
        const senderName = message.sender.vtuberProfile?.displayName || message.sender.username || username || 'Un usuario';
        NotificationsService.notifyDM(senderName, userId, data.receiverId).catch(() => {});
      } catch (err) {
        console.error('[Socket] Error sending DM:', err);
        socket.emit('dm:error', { message: 'Error al enviar mensaje' });
      }
    });

    // Handle typing indicators for DMs
    socket.on('dm:typing', (data: { receiverId: string; isTyping: boolean }) => {
      socket.to(`user:${data.receiverId}`).emit('dm:typing', {
        userId,
        username,
        isTyping: data.isTyping,
      });
    });

    // Handle read receipts for DMs
    socket.on('dm:read', async (data: { messageIds: string[] }) => {
      if (!data.messageIds?.length) return;
      try {
        await prisma.directMessage.updateMany({
          where: {
            id: { in: data.messageIds },
            receiverId: userId,
            read: false,
          },
          data: { read: true },
        });
      } catch (err) {
        console.error('[Socket] Error marking DMs as read:', err);
      }
    });

    // Handle room joins
    socket.on('chat:join', (data: { room: string }) => {
      socket.join(data.room);
      console.log(`[Socket] ${username} joined room: ${data.room}`);
    });

    // ===== GUILD CHANNEL MESSAGING =====

    // Track which guilds this socket has joined (for disconnect cleanup)
    if (!socket.data.guilds) socket.data.guilds = new Set<string>();

    // Join a guild's channels for real-time messaging
    socket.on('guild:join', (data: { guildId: string }) => {
      const room = `guild:${data.guildId}`;
      socket.join(room);
      (socket.data.guilds as Set<string>).add(data.guildId);
      addOnlineUser(data.guildId, userId);
      broadcastOnline(data.guildId);
      console.log(`[Socket] ${username} joined guild room: ${room}`);
    });

    // Leave a guild's channels
    socket.on('guild:leave', (data: { guildId: string }) => {
      const room = `guild:${data.guildId}`;
      socket.leave(room);
      (socket.data.guilds as Set<string>).delete(data.guildId);
      removeOnlineUser(data.guildId, userId);
      broadcastOnline(data.guildId);
      console.log(`[Socket] ${username} left guild room: ${room}`);
    });

    // Handle guild typing events
    socket.on('guild:typing', (data: { guildId: string; channelId: string; isTyping: boolean }) => {
      socket.to(`guild:${data.guildId}`).emit('guild:typing', {
        userId,
        username,
        displayName: socket.data.displayName ?? null,
        channelId: data.channelId,
        isTyping: data.isTyping,
      });
    });

    // Send a message to a guild channel
    socket.on('guild:message', async (data: { guildId: string; channelId: string; content?: string; imageUrl?: string }) => {
      // Rate limiting
      if (!messageLimiter.allow(userId)) {
        socket.emit('guild:error', { message: 'Enviando mensajes muy rápido. Espera unos segundos.' });
        return;
      }
      // Validate IDs
      if (!isValidCuid(data.guildId) || !isValidCuid(data.channelId)) return;
      // Sanitize content
      const content = data.content ? sanitizeMessage(data.content, 2000) : null;
      if (!content && !data.imageUrl) return;

      try {
        // Verify membership
        const member = await prisma.guildMember.findUnique({
          where: { guildId_userId: { guildId: data.guildId, userId } },
        });
        if (!member) {
          socket.emit('guild:error', { message: 'No eres miembro de este gremio.' });
          return;
        }

        const message = await prisma.guildChannelMessage.create({
          data: {
            channelId: data.channelId,
            guildId: data.guildId,
            userId,
            content: content || '',
            imageUrl: data.imageUrl,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                role: true,
                vtuberProfile: { select: { displayName: true, avatarUrl: true, isVerified: true } },
                purchases: {
                  where: { equipped: true },
                  include: { item: true },
                },
              },
            },
          },
        });

        // Broadcast to all members in the guild room
        io.to(`guild:${data.guildId}`).emit('guild:message', {
          id: message.id,
          channelId: message.channelId,
          guildId: message.guildId,
          content: message.content,
          imageUrl: message.imageUrl,
          createdAt: message.createdAt.toISOString(),
          user: message.user,
        });
      } catch (err) {
        console.error('[Socket] Error sending guild message:', err);
        socket.emit('guild:error', { message: 'Error al enviar mensaje.' });
      }
    });

    // Handle guild message deletion
    socket.on('guild:delete-message', async (data: { messageId: string; guildId: string; channelId: string }) => {
      try {
        const message = await prisma.guildChannelMessage.findUnique({ where: { id: data.messageId } });
        if (!message) {
          socket.emit('chat:error', { message: 'Mensaje no encontrado' });
          return;
        }

        const adminUser = await prisma.user.findUnique({ where: { id: userId } });
        const isAdmin = hasAnyRole(adminUser?.role, ['ADMIN', 'MODERATOR', 'STAFF']);

        if (message.userId !== userId && !isAdmin) {
          socket.emit('chat:error', { message: 'No tienes permiso para eliminar este mensaje' });
          return;
        }

        await prisma.guildChannelMessage.delete({ where: { id: data.messageId } });

        io.to(`guild:${data.guildId}`).emit('guild:message-deleted', {
          messageId: data.messageId,
          channelId: data.channelId,
        });
      } catch (err) {
        console.error('[Socket] Error deleting guild message:', err);
        socket.emit('chat:error', { message: 'Error al eliminar mensaje' });
      }
    });

    // Handle message deletion (owned or admin)
    socket.on('chat:delete-message', async (data: { messageId: string; room?: string }) => {
      try {
        const message = await prisma.chatMessage.findUnique({ where: { id: data.messageId } });
        if (!message) {
          socket.emit('chat:error', { message: 'Mensaje no encontrado' });
          return;
        }
        
        const adminUser = await prisma.user.findUnique({ where: { id: userId } });
        const isAdmin = hasAnyRole(adminUser?.role, ['ADMIN', 'MODERATOR', 'STAFF']);
        
        // Allow if user owns the message OR is admin
        if (message.userId !== userId && !isAdmin) {
          socket.emit('chat:error', { message: 'No tienes permiso para eliminar este mensaje' });
          return;
        }

        await prisma.chatMessage.delete({ where: { id: data.messageId } });
        
        // Notify the room that the message was deleted
        const room = data.room || 'global';
        io.to(room).emit('chat:message-deleted', { messageId: data.messageId });
      } catch (err) {
        console.error('[Socket] Error deleting message:', err);
        socket.emit('chat:error', { message: 'Error al eliminar mensaje' });
      }
    });

    // Handle DM deletion (owned or admin)
    socket.on('dm:delete-message', async (data: { messageId: string }) => {
      try {
        const message = await prisma.directMessage.findUnique({ where: { id: data.messageId } });
        if (!message) {
          socket.emit('chat:error', { message: 'Mensaje no encontrado' });
          return;
        }
        
        const adminUser = await prisma.user.findUnique({ where: { id: userId } });
        const isAdmin = hasAnyRole(adminUser?.role, ['ADMIN', 'MODERATOR', 'STAFF']);
        
        // Allow if user is sender/receiver OR admin
        if (message.senderId !== userId && message.receiverId !== userId && !isAdmin) {
          socket.emit('chat:error', { message: 'No tienes permiso para eliminar este mensaje' });
          return;
        }

        await prisma.directMessage.delete({ where: { id: data.messageId } });
        
        // Notify both users that the message was deleted
        io.to(`user:${message.senderId}`).emit('dm:message-deleted', { messageId: data.messageId });
        io.to(`user:${message.receiverId}`).emit('dm:message-deleted', { messageId: data.messageId });
      } catch (err) {
        console.error('[Socket] Error deleting DM:', err);
        socket.emit('chat:error', { message: 'Error al eliminar mensaje' });
      }
    });

    socket.on('disconnect', () => {
      // Remove from global presence tracking
      globalOnlineUsers.delete(userId);
      socket.broadcast.emit('user:offline', { userId });

      // Clean up rate limiter entry
      messageLimiter.remove(userId);

      // Remove user from all guilds they were in
      const guilds = socket.data.guilds as Set<string> | undefined;
      if (guilds) {
        guilds.forEach(guildId => {
          removeOnlineUser(guildId, userId);
          broadcastOnline(guildId);
        });
        guilds.clear();
      }
      console.log(`[Socket] User disconnected: ${username} (${userId})`);
    });
  });

  return io;
};
