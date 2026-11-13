import { Router } from 'express';
import { authenticate } from '../auth/authenticate';
import * as ReferralController from './referral.controller';

const router = Router();

// Rutas públicas
router.get('/leaderboard', ReferralController.getLeaderboard);
router.get('/check/:code', ReferralController.checkReferralCode);

// Rutas protegidas
router.get('/me', authenticate, ReferralController.getMyReferrals);

export default router;
