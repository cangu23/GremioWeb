import { Router } from 'express';
import { authenticate } from '../auth/authenticate';
import { optionalAuth } from '../auth/optionalAuth';
import * as PaymentsController from './payments.controller';

const router = Router();

// Public
router.get('/tiers', optionalAuth, PaymentsController.getTiers);
router.get('/tiers/:id', optionalAuth, PaymentsController.getTierById);

// Protected - subscriptions
router.get('/subscription/me', authenticate, PaymentsController.getMySubscription);
router.get('/subscriptions/me', authenticate, PaymentsController.getMySubscriptions);
router.post('/subscribe', authenticate, PaymentsController.subscribe);
router.post('/cancel', authenticate, PaymentsController.cancelSubscription);

// Protected - donations
router.post('/donate', authenticate, PaymentsController.donate);
router.get('/donations/me', authenticate, PaymentsController.getDonations);
router.get('/donations/sent', authenticate, PaymentsController.getDonationsSent);
router.get('/donations/stats', authenticate, PaymentsController.getDonationStats);

// Admin
router.post('/seed', authenticate, PaymentsController.seedTiers);

export default router;
