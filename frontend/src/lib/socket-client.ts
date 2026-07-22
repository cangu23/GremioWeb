'use client';

import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  ? process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api', '')
  : '';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => socket;

export const connectSocket = (): Socket => {
  if (socket?.connected) return socket;

  const token = getAccessToken();
  if (!token) throw new Error('No auth token');

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    // connected
  });

  socket.on('disconnect', (reason) => {
    // disconnected
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const NOTIFICATION_EVENTS = {
  NEW: 'notification:new',
} as const;

export const CHAT_EVENTS = {
  MESSAGE: 'chat:message',
  HISTORY: 'chat:history',
  JOIN: 'chat:join',
  TYPING: 'chat:typing',
  ERROR: 'chat:error',
  DELETE: 'chat:delete-message',
  DELETED: 'chat:message-deleted',
} as const;

export const DM_EVENTS = {
  MESSAGE: 'dm:message',
  TYPING: 'dm:typing',
  READ: 'dm:read',
  DELETE: 'dm:delete-message',
  DELETED: 'dm:message-deleted',
} as const;

export const GUILD_EVENTS = {
  DELETE: 'guild:delete-message',
  DELETED: 'guild:message-deleted',
} as const;

export const MEDIA_EVENTS = {
  READY: 'media:ready',
  ERROR: 'media:error',
} as const;

export type MediaReadyPayload = {
  id: string;
  url: string;
  format?: string;
  size_bytes?: number;
  original_size_bytes?: number;
  animated?: boolean;
};

export type MediaErrorPayload = {
  id: string;
  error: string;
};
