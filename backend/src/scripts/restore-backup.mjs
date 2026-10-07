import { readFileSync, writeFileSync, existsSync, readdirSync, copyFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = join(__dirname, '..', '..', '..', 'tmp', 'gremio-backups', 'jquery-chat-backup-1791334041');

const FILES = [
  { from: join(BACKUP_DIR, 'frontend/src/lib/socket-client.ts.bak'), to: join(process.cwd(), 'frontend/src/lib/socket-client.ts') },
  { from: join(BACKUP_DIR, 'frontend/src/lib/api.ts.bak'), to: join(process.cwd(), 'frontend/src/lib/api.ts') },
  { from: join(BACKUP_DIR, 'frontend/src/components/layout/Navbar.tsx.bak'), to: join(process.cwd(), 'frontend/src/components/layout/Navbar.tsx') },
  { from: join(BACKUP_DIR, 'frontend/src/app/chat/page.tsx.bak'), to: join(process.cwd(), 'frontend/src/app/chat/page.tsx') },
  { from: join(BACKUP_DIR, 'frontend/next.config.mjs.bak'), to: join(process.cwd(), 'frontend/next.config.mjs') },
  { from: join(BACKUP_DIR, 'backend/src/modules/shop/shop.service.ts.bak'), to: join(process.cwd(), 'backend/src/modules/shop/shop.service.ts') },
  { from: join(BACKUP_DIR, 'backend/src/modules/shop/shop.controller.ts.bak'), to: join(process.cwd(), 'backend/src/modules/shop/shop.controller.ts') },
  { from: join(BACKUP_DIR, 'backend/src/modules/gamification/gamification.service.ts.bak'), to: join(process.cwd(), 'backend/src/modules/gamification/gamification.service.ts') },
  { from: join(BACKUP_DIR, 'backend/src/modules/gamification/gamification.controller.ts.bak'), to: join(process.cwd(), 'backend/src/modules/gamification/gamification.controller.ts') },
  { from: join(BACKUP_DIR, 'backend/src/modules/ecosystem/missions.service.ts.bak'), to: join(process.cwd(), 'backend/src/modules/ecosystem/missions.service.ts') },
  { from: join(BACKUP_DIR, 'backend/src/modules/ecosystem/seasons.service.ts.bak'), to: join(process.cwd(), 'backend/src/modules/ecosystem/seasons.service.ts') },
  { from: join(BACKUP_DIR, 'backend/src/modules/notifications/notifications.service.ts.bak'), to: join(process.cwd(), 'backend/src/modules/notifications/notifications.service.ts') },
  { from: join(BACKUP_DIR, 'backend/src/modules/notifications/notifications.controller.ts.bak'), to: join(process.cwd(), 'backend/src/modules/notifications/notifications.controller.ts') },
  { from: join(BACKUP_DIR, 'backend/src/modules/notifications/notifications.routes.ts.bak'), to: join(process.cwd(), 'backend/src/modules/notifications/notifications.routes.ts') },
  { from: join(BACKUP_DIR, 'backend/src/modules/posts/posts.routes.ts.bak'), to: join(process.cwd(), 'backend/src/modules/posts/posts.routes.ts') },
  { from: join(BACKUP_DIR, 'backend/src/modules/posts/posts.controller.ts.bak'), to: join(process.cwd(), 'backend/src/modules/posts/posts.controller.ts') },
  { from: join(BACKUP_DIR, 'backend/package.json.bak'), to: join(process.cwd(), 'backend/package.json') },
  { from: join(BACKUP_DIR, 'package.json.bak'), to: join(process.cwd(), 'package.json') },
  { from: join(BACKUP_DIR, 'backend/src/index.ts.bak'), to: join(process.cwd(), 'backend/src/index.ts') },
  { from: join(BACKUP_DIR, 'backend/src/server.ts.bak'), to: join(process.cwd(), 'backend/src/server.ts') },
];

const missing = FILES.filter(({ from }) => !existsSync(from));
if (missing.length > 0) {
  console.error('[RESTORE] Los siguientes archivos de backup no existen:');
  missing.forEach(({ from }) => console.error(from));
  process.exit(1);
}

for (const { from, to } of FILES) {
  const dir = dirname(to);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  copyFileSync(from, to);
  console.log(`[RESTORE] ${to} → OK`);
}

console.log('[RESTORE] ¡Restore completado!');
