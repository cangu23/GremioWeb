import http from 'http';
import app from './app';
import env from './config/env';
import { createSocketServer } from './websocket/socket.server';
import { startStreamMonitor } from './modules/vtubers/stream-monitor.service';
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
log.info('HTTP server + Socket.IO initialized');

// Start automatic live stream detection
startStreamMonitor();

// Seed achievements in DB
seedAchievements().catch((err) => log.error({ err }, 'Error seeding achievements'));

server.listen(env.PORT, () => {
  log.info(`Server running on port ${env.PORT} — http://localhost:${env.PORT}/api/health`);
});

server.on('error', (err) => {
  log.error({ err }, 'Server error');
});

export default server;
