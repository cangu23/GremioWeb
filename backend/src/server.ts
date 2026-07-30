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
  log.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection:', reason);
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
seedAchievements().catch(err => log.error('Error seeding achievements:', err));

server.listen(env.PORT, () => {
  log.info(`Server running on port ${env.PORT} — http://localhost:${env.PORT}/api/health`);
});

server.on('error', (err) => {
  log.error('Server error:', err);
});

export default server;
