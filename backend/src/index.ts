import { Router } from 'express';
import healthRoutes from './modules/health/health.routes';
import authRoutes from './modules/auth/auth.routes';
import adminRoutes from './modules/auth/admin.routes';
import { adminRoutes as adminModuleRoutes } from './modules/admin';

import * as RequestsController from './modules/admin/requests.controller';
import { authenticate, authenticateOptional } from './modules/auth/authenticate';
import userRoutes from './modules/users/user.routes';
import socialRoutes from './modules/social/social.routes';
import friendRoutes from './modules/social/friends.routes';
import eventRoutes from './modules/events/events.routes';
import guildRoutes from './modules/guilds/guilds.routes';
import gamificationRoutes from './modules/gamification/gamification.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import paymentRoutes from './modules/payments/payments.routes';
import postRoutes from './modules/posts/posts.routes';
import dmRoutes from './modules/posts/dm.routes';
import groupRoutes from './modules/groups/groups.routes';
import uploadRoutes from './modules/uploads/uploads.routes';
import statsRoutes from './modules/stats/stats.routes';
import activityRoutes from './modules/activity/activity.routes';
import vtuberRoutes from './modules/vtubers/vtubers.routes';
import streamerRoutes from './modules/streamers/streamers.routes';
import shopRoutes from './modules/shop/shop.routes';
import dailyRewardsRoutes from './modules/daily-rewards/daily-rewards.routes';
import rouletteRoutes from './modules/roulette/roulette.routes';
import warningsRoutes from './modules/warnings/warnings.routes';
import ecosystemRoutes from './modules/ecosystem/ecosystem.routes';
import searchRoutes from './modules/search/search.routes';
import newsRoutes from './modules/news/news.routes';
import * as StickersController from './modules/admin/stickers.controller';
import { searchRateLimiter, uploadRateLimiter } from './middleware/rateLimiters';
import { createLogger } from './utils/logger';

const log = createLogger('ROUTES');
const router = Router();

// ─── Module Routes ────────────────────────────────────────────────

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/admin', adminModuleRoutes);
router.use('/users', userRoutes);
router.use('/user', userRoutes); // Alias for frontend compatibility
router.use('/social', socialRoutes);
router.use('/friends', friendRoutes);
router.use('/events', eventRoutes);
router.use('/guilds', guildRoutes);
router.use('/gamification', gamificationRoutes);
router.use('/notifications', notificationRoutes);
router.use('/payments', paymentRoutes);
router.use('/posts', postRoutes);
router.use('/dm', dmRoutes);
router.use('/groups', groupRoutes);
router.use('/vtubers', vtuberRoutes);
router.use('/streamers', streamerRoutes);
router.use('/uploads', uploadRateLimiter, uploadRoutes);
router.use('/stats', statsRoutes);
router.use('/activity', activityRoutes);
router.use('/shop', shopRoutes);
router.use('/daily-rewards', dailyRewardsRoutes);
router.use('/roulette', rouletteRoutes);
router.use('/warnings', warningsRoutes);
router.use('/ecosystem', ecosystemRoutes);
router.use('/search', searchRateLimiter, searchRoutes);
router.use('/news', newsRoutes);

// ─── Standalone Routes ────────────────────────────────────────────

// VTuber request (authenticated users)
router.post('/vtubers/request', authenticate, RequestsController.submitRequest);

// Streamer request (authenticated users)
router.post('/streamers/request', authenticate, RequestsController.submitRequest);

// Public stickers endpoint (optional auth, plan-gated for exclusivity)
router.get('/stickers', authenticateOptional, StickersController.getActiveStickers);

// Root health check
router.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'gremio-estelar-api', timestamp: new Date().toISOString() });
});

log.info('All API routes registered (24 modules)');

export default router;