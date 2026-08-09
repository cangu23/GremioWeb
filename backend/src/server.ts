import http from 'http';
import app from './app';
import env from './config/env';
import prisma from './database/prisma';
import { createSocketServer } from './websocket/socket.server';
import { startStreamMonitor, stopStreamMonitor } from './modules/vtubers/stream-monitor.service';
import { startStreamMonitor as startStreamerMonitor, stopStreamMonitor as stopStreamerMonitor } from './modules/streamers/stream-monitor.service';
import { seedAchievements } from './modules/gamification/gamification.service';
import { createLogger } from './utils/logger';

const log = createLogger('BOOT');

// ──────────────────────────────────────────────
// UNCAUGHT EXCEPTIONS & REJECTIONS
// ──────────────────────────────────────────────

process.on('uncaughtException', (err) => {
  log.error({ err }, 'Uncaught Exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log.error({ reason }, 'Unhandled Rejection');
});

// ──────────────────────────────────────────────
// STARTUP
// ──────────────────────────────────────────────

log.info(`Starting server — Node ${process.version}, ${process.platform}, NODE_ENV=${process.env.NODE_ENV || 'not set'}`);

const server = http.createServer(app);
createSocketServer(server);
log.info('HTTP server + Socket.IO initialized');// Start automatic live stream detection
  startStreamMonitor();
  startStreamerMonitor();

// Seed achievements in DB
seedAchievements().catch((err) => log.error({ err }, 'Error seeding achievements'));

server.listen(env.PORT, '0.0.0.0', () => {
  log.info(`Server running on port ${env.PORT} — http://127.0.0.1:${env.PORT}/api/health`);
});

server.on('error', (err) => {
  log.error({ err }, 'Server error');
});

// ──────────────────────────────────────────────
// GRACEFUL SHUTDOWN (SIGTERM/SIGINT)
// ──────────────────────────────────────────────
// Cierra el servidor HTTP (y con él Socket.IO), detiene el monitor de streams
// y desconecta Prisma para no cortar consultas a mitad de camino ni dejar
// conexiones abiertas cuando la plataforma (Render/Docker) envía SIGTERM.
const SHUTDOWN_TIMEOUT_MS = 10_000;

function shutdown(signal: string) {
  log.info(`Received ${signal} — shutting down gracefully...`);
  stopStreamMonitor();
  stopStreamerMonitor();

  // Cierra también las conexiones keep-alive inactivas (en Node 20, server.close
  // no las termina por sí solo y puede colgar el cierre hasta el timeout).
  server.closeIdleConnections?.();
  server.close(() => {
    log.info('HTTP server closed. Disconnecting database...');
    prisma.$disconnect().finally(() => process.exit(0));
  });

  // Red de seguridad: si el cierre elegante se queda colgado, forzar salida.
  setTimeout(() => {
    log.error('Graceful shutdown timed out — forcing exit.');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default server;
