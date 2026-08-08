'use client';

import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';

// URL del servidor Socket.IO.
// 1º) NEXT_PUBLIC_SOCKET_URL explícita (recomendada en producción cuando el
//     backend vive en un servicio/host distinto del frontend).
// 2º) Derivada de NEXT_PUBLIC_API_BASE_URL (quita el sufijo /api).
// 3º) Misma origin que la página (funciona en el monolito Next+Express si el
//     rewrite /socket.io está configurado, y en desarrollo con el proxy).
const deriveSocketUrl = () => {
  const explicit = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (explicit) return explicit.replace(/\/+$/, '');
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (apiBase) {
    // Quita el sufijo /api (o /api/) para obtener el host del socket.
    // Si el resultado queda vacío (p.ej. apiBase='/api' en el monolito),
    // cae al siguiente fallback en vez de devolver ''.
    const derived = apiBase.replace(/\/api\/?$/, '');
    if (derived) return derived;
  }
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
};

const SOCKET_URL = deriveSocketUrl();

let socket: Socket | null = null;

export const getSocket = (): Socket | null => socket;

export const connectSocket = (): Socket => {
  const token = getAccessToken();

  if (socket) {
    if (token && (socket as any).auth?.token !== token) {
      (socket as any).auth = { token };
      if (socket.connected) {
        socket.disconnect();
      }
      socket.connect();
    } else if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  if (!token) throw new Error('No auth token');

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on('connect_error', async (err) => {
    console.warn('[Socket] Connection error:', err.message, '→ target:', SOCKET_URL);
    if (err.message.includes('token') || err.message.includes('Authentication') || err.message.includes('cuenta')) {
      try {
        const { performRefresh } = await import('./api');
        const newToken = await performRefresh();
        if (newToken && socket) {
          (socket as any).auth = { token: newToken };
          socket.connect();
        }
      } catch {
        // silent
      }
    }
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

export const DM_EVENTS = {
  MESSAGE: 'dm:message',
  TYPING: 'dm:typing',
  READ: 'dm:read',
  READ_RECEIPT: 'dm:read-receipt',
  REACTION: 'dm:reaction',
  DELETE: 'dm:delete-message',
  DELETED: 'dm:message-deleted',
} as const;

export const GUILD_EVENTS = {
  DELETE: 'guild:delete-message',
  // Unificado con el nombre que emite el backend (REST y socket) y que escucha
  // la página de gremios: `guild:message:deleted` (con dos puntos).
  DELETED: 'guild:message:deleted',
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
