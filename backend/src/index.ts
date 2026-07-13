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

console.log(`${BOOT} 🛤️  Registering API routes...`);

// Module routes
router.use('/health', healthRoutes);
console.log(`${BOOT}   ✅ /api/health`);

router.use('/auth', authRoutes);
console.log(`${BOOT}   ✅ /api/auth (login, register, google, discord, refresh, logout)`);

router.use('/admin', adminRoutes);
console.log(`${BOOT}   ✅ /api/admin (auth admin routes)`);

router.use('/admin', adminModuleRoutes);
console.log(`${BOOT}   ✅ /api/admin (module admin routes)`);

// 📋 VTuber request (authenticated users)
router.post('/vtubers/request', authenticate, RequestsController.submitRequest);
console.log(`${BOOT}   ✅ POST /api/vtubers/request`);

router.use('/users', userRoutes);
console.log(`${BOOT}   ✅ /api/users`);

router.use('/social', socialRoutes);
console.log(`${BOOT}   ✅ /api/social`);

router.use('/events', eventRoutes);
console.log(`${BOOT}   ✅ /api/events`);

router.use('/guilds', guildRoutes);
console.log(`${BOOT}   ✅ /api/guilds`);

router.use('/gamification', gamificationRoutes);
console.log(`${BOOT}   ✅ /api/gamification`);

router.use('/notifications', notificationRoutes);
console.log(`${BOOT}   ✅ /api/notifications`);

router.use('/chat', chatRoutes);
console.log(`${BOOT}   ✅ /api/chat`);

router.use('/payments', paymentRoutes);
console.log(`${BOOT}   ✅ /api/payments`);

router.use('/posts', postRoutes);
console.log(`${BOOT}   ✅ /api/posts`);

router.use('/dm', dmRoutes);
console.log(`${BOOT}   ✅ /api/dm`);

router.use('/vtubers', vtuberRoutes);
console.log(`${BOOT}   ✅ /api/vtubers`);

router.use('/uploads', uploadRoutes);
console.log(`${BOOT}   ✅ /api/uploads`);

router.use('/stats', statsRoutes);
console.log(`${BOOT}   ✅ /api/stats`);

router.use('/activity', activityRoutes);
console.log(`${BOOT}   ✅ /api/activity`);

// Also mount health at root for quick checks
router.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'gremio-estelar-api', timestamp: new Date().toISOString() });
});

console.log(`${BOOT} 🛤️  All API routes registered successfully ✅`);

export default router;