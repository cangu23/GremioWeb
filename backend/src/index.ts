import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './modules/auth/auth.routes';
import adminRoutes from './modules/auth/admin.routes';
import { adminRoutes as adminModuleRoutes } from './modules/admin';

import * as RequestsController from './modules/admin/requests.controller';
import { authenticate } from './modules/auth/authenticate';
import userRoutes from './modules/users/user.routes';
import socialRoutes from './modules/social/social.routes';
import eventRoutes from './modules/events/events.routes';
import guildRoutes from './modules/guilds/guilds.routes';
import gamificationRoutes from './modules/gamification/gamification.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import chatRoutes from './modules/chat/chat.routes';
import paymentRoutes from './modules/payments/payments.routes';
import postRoutes from './modules/posts/posts.routes';
import dmRoutes from './modules/posts/dm.routes';
import uploadRoutes from './modules/uploads/uploads.routes';
import statsRoutes from './modules/stats/stats.routes';
import activityRoutes from './modules/activity/activity.routes';
import vtuberRoutes from './modules/vtubers/vtubers.routes';

const BOOT = '[BOOT]';
const router = Router();

console.log(`${BOOT} Registering API routes...`);

// Module routes
router.use('/health', healthRoutes);
console.log(`${BOOT}   [OK] /api/health`);

router.use('/auth', authRoutes);
console.log(`${BOOT}   [OK] /api/auth (login, register, google, discord, refresh, logout)`);

router.use('/admin', adminRoutes);
console.log(`${BOOT}   [OK] /api/admin (auth admin routes)`);

router.use('/admin', adminModuleRoutes);
console.log(`${BOOT}   [OK] /api/admin (module admin routes)`);

// VTuber request (authenticated users)
router.post('/vtubers/request', authenticate, RequestsController.submitRequest);
console.log(`${BOOT}   [OK] POST /api/vtubers/request`);

router.use('/users', userRoutes);
console.log(`${BOOT}   [OK] /api/users`);

router.use('/social', socialRoutes);
console.log(`${BOOT}   [OK] /api/social`);

router.use('/events', eventRoutes);
console.log(`${BOOT}   [OK] /api/events`);

router.use('/guilds', guildRoutes);
console.log(`${BOOT}   [OK] /api/guilds`);

router.use('/gamification', gamificationRoutes);
console.log(`${BOOT}   [OK] /api/gamification`);

router.use('/notifications', notificationRoutes);
console.log(`${BOOT}   [OK] /api/notifications`);

router.use('/chat', chatRoutes);
console.log(`${BOOT}   [OK] /api/chat`);

router.use('/payments', paymentRoutes);
console.log(`${BOOT}   [OK] /api/payments`);

router.use('/posts', postRoutes);
console.log(`${BOOT}   [OK] /api/posts`);

router.use('/dm', dmRoutes);
console.log(`${BOOT}   [OK] /api/dm`);

router.use('/vtubers', vtuberRoutes);
console.log(`${BOOT}   [OK] /api/vtubers`);

router.use('/uploads', uploadRoutes);
console.log(`${BOOT}   [OK] /api/uploads`);

router.use('/stats', statsRoutes);
console.log(`${BOOT}   [OK] /api/stats`);

router.use('/activity', activityRoutes);
console.log(`${BOOT}   [OK] /api/activity`);

// Also mount health at root for quick checks
router.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'gremio-estelar-api', timestamp: new Date().toISOString() });
});

console.log(`${BOOT} All API routes registered successfully`);

export default router;