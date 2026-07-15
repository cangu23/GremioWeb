import http from 'http';
import app from './app';
import env from './config/env';
import { createSocketServer } from './websocket/socket.server';
import { startStreamMonitor } from './modules/vtubers/stream-monitor.service';

const BOOT = '[BOOT]';

// ──────────────────────────────────────────────
// UNCAUGHT EXCEPTIONS & REJECTIONS
// ──────────────────────────────────────────────

process.on('uncaughtException', (err) => {
  console.error(`${BOOT} [FATAL] Uncaught Exception:`, err);
  console.error(`${BOOT} [FATAL] Stack:`, err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`${BOOT} [FATAL] Unhandled Rejection at:`, promise);
  console.error(`${BOOT} [FATAL] Reason:`, reason);
});

// ──────────────────────────────────────────────
// STARTUP
// ──────────────────────────────────────────────

console.log(`${BOOT} [${new Date().toISOString()}] Starting server...`);
console.log(`${BOOT} Node version: ${process.version}`);
console.log(`${BOOT} Platform: ${process.platform}`);
console.log(`${BOOT} NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`${BOOT} PORT: ${env.PORT}`);

const server = http.createServer(app);
console.log(`${BOOT} HTTP server created`);

// Attach Socket.IO
console.log(`${BOOT} Attaching Socket.IO...`);
createSocketServer(server);
console.log(`${BOOT} Socket.IO attached`);

// Start automatic live stream detection
startStreamMonitor();

console.log(`${BOOT} Attempting to listen on port ${env.PORT}...`);
server.listen(env.PORT, () => {
  console.log(`${BOOT} [${new Date().toISOString()}] Server running on port ${env.PORT}`);
  console.log(`${BOOT} Health check: http://localhost:${env.PORT}/api/health`);
});

// Log when server actually starts accepting connections
server.on('listening', () => {
  console.log(`${BOOT} Server listening event confirmed`);
});

server.on('error', (err) => {
  console.error(`${BOOT} [FATAL] Server error:`, err);
});

export default server;
