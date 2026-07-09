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

const router = Router();

// Module routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/admin', adminModuleRoutes);
// 📋 VTuber request (authenticated users)
router.post('/vtubers/request', authenticate, RequestsController.submitRequest);

router.use('/users', userRoutes);
router.use('/social', socialRoutes);
router.use('/events', eventRoutes);
router.use('/guilds', guildRoutes);
router.use('/gamification', gamificationRoutes);
router.use('/notifications', notificationRoutes);
router.use('/chat', chatRoutes);
router.use('/payments', paymentRoutes);
router.use('/posts', postRoutes);
router.use('/dm', dmRoutes);

// Also mount health at root for quick checks
router.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'gremio-estelar-api', timestamp: new Date().toISOString() });
});

export default router;