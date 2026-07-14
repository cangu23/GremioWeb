import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from '../config/env';
import prisma from '../database/prisma';

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
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // In development, allow all origins
        callback(null, true);
      },
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token as string, env.JWT_ACCESS_SECRET) as { userId: string; username: string };
      socket.userId = decoded.userId;
      socket.username = decoded.username;
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

    // Send recent message history
    const recentMessages = await prisma.chatMessage.findMany({
      where: { room: 'global' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            vtuberProfile: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
    });

    socket.emit('chat:history', recentMessages.reverse());

    // Handle new messages
    socket.on('chat:message', async (data: { content: string; room?: string }) => {
      const room = data.room || 'global';
      const content = data.content?.trim();

      if (!content || content.length > 1000) return;

      try {
        const message = await prisma.chatMessage.create({
          data: {
            room,
            userId,
            content,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                vtuberProfile: { select: { displayName: true, avatarUrl: true } },
              },
            },
          },
        });

        socket.to(room).emit('chat:message', {
          id: message.id,
          room: message.room,
          userId: message.userId,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          user: {
            id: message.user.id,
            username: message.user.username,
            avatarUrl: message.user.vtuberProfile?.avatarUrl ?? null,
            displayName: message.user.vtuberProfile?.displayName ?? null,
          },
        });
      } catch (err) {
        console.error('[Socket] Error saving message:', err);
        socket.emit('chat:error', { message: 'Error al enviar mensaje' });
      }
    });

    // Handle typing events
    socket.on('chat:typing', (data: { room?: string; isTyping: boolean }) => {
      const room = data.room || 'global';
      socket.to(room).emit('chat:typing', {
        userId,
        username,
        isTyping: data.isTyping,
      });
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
      const content = data.content?.trim();
      if (!content && !data.imageUrl) return;
      if (content && content.length > 2000) return;

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
                vtuberProfile: { select: { displayName: true, avatarUrl: true, isVerified: true } },
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
          user: {
            id: message.user.id,
            username: message.user.username,
            displayName: message.user.vtuberProfile?.displayName ?? null,
            avatarUrl: message.user.vtuberProfile?.avatarUrl ?? null,
            isVerified: message.user.vtuberProfile?.isVerified ?? false,
          },
        });
      } catch (err) {
        console.error('[Socket] Error sending guild message:', err);
        socket.emit('guild:error', { message: 'Error al enviar mensaje.' });
      }
    });

    socket.on('disconnect', () => {
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
