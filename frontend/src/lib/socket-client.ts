'use client';

import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';

// URL del servidor Socket.IO.
// Esta función elige la URL del socket según la estrategia oficial de
// despliegue. No adivina en función del contexto: en producción el
// frontend y el backend suelen vivir en orígenes distintos, y el socket
// NO debe pasar por la reescritura de Next (/socket.io -> Express interno)
// porque esa reescritura NO realiza upgrade de WebSocket.
//
// Reglas de despliegue (documentadas también en frontend/next.config.mjs):
//  1. BACKEND_SEPARADO: el frontend y backend están en servicios distintos
//     (p.ej. Render: frontend + backend). En este caso, el socket conecta
//     directamente al backend público.
//     -> Obligatorio: NEXT_PUBLIC_SOCKET_URL = https://gremioweb.onrender.com
//        (sin /api, sin barra final).
//  2. MONOLITO: frontend y backend corren en el mismo contenedor/host y el
//     socket está expuesto públicamente en la misma origin que Next.
//     -> Puedes usar la origin del frontend, pero SIEMPRE que el socket
//        esté accesible desde el navegador directamente, no a través del
//        rewrite de Next.
//
// IMPORTANTE: si usas BACKEND_SEPARADO, no relies en derivar desde
// NEXT_PUBLIC_API_BASE_URL. Ese valor apunta a /api y el socket no
// debería ir por ahí.
const deriveSocketUrl = () => {
  const explicit = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (explicit) return explicit.replace(/\/+$/, '');
  // Si NEXT_PUBLIC_API_BASE_URL está definido, en BACKEND_SEPARADO suele ser
  // algo como https://gremioweb.onrender.com/api. El socket NO va por ahí.
  // No derivamos a menos que sepamos que en ese entorno el backend está en la
  // misma origin que Next y expone socket públicamente.
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (apiBase) {
    const derived = apiBase.replace(/\/api\/?$/, '');
    if (derived && derived !== '') return derived;
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
    reconnectionAttempts: 15, // antes Infinity: bucle infinito con token muerto
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    timeout: 20000,
  });

  socket.on('connect_error', async (err) => {
    console.warn('[Socket] Connection error:', err.message, '→ target:', SOCKET_URL);
    if (err.message.includes('token') || err.message.includes('Authentication') || err.message.includes('cuenta')) {
      try {
        const { performRefresh } = await import('./api');
        const result = await performRefresh();
        const newToken = result?.accessToken;
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

// ── Sesión expirada → desconectar ─────────────────────────────────────────
// Antes, un socket con token muerto reintentaba PARA SIEMPRE (Infinity),
// llenando la consola de "[Socket] Connection error: timeout" tras el logout
// o la expiración de sesión (auth:unauthorized). Tiramos el socket compartido;
// los componentes que lo usan lo recrean al volver a iniciar sesión.
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
  });

  // Auto-reconexión al volver a la pestaña / visibilidad.
  // Con reintentos acotados (15), un cold start largo de Render (free tier)
  // puede agotarlos antes de que el usuario vuelva a interactuar; al recuperar
  // el foco reintentamos en vez de quedarnos muertos hasta recargar la página.
  // Usamos un backoff simple para no saturar el servidor tras reconexiones
  // rápidas (p.ej. varios tabs volviendo a la vez).
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  const scheduleReconnect = () => {
    if (reconnectTimer) return; // una sola cola para toda la página
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (socket && !socket.connected && getAccessToken()) {
        socket.connect();
      }
    }, 400);
  };
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleReconnect();
  });
  window.addEventListener('focus', scheduleReconnect);
}

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
