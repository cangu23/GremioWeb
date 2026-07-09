import { Router } from 'express';
import { authenticate } from '../auth/authenticate';
import * as NotificationsController from './notifications.controller';

const router = Router();

router.use(authenticate); // All notification routes require auth

router.get('/', NotificationsController.getMyNotifications);
router.get('/unread-count', NotificationsController.getUnreadCount);
router.put('/read-all', NotificationsController.markAllAsRead);
router.put('/:id/read', NotificationsController.markAsRead);

export default router;
