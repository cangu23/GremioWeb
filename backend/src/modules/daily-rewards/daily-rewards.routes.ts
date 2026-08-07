import { Router } from 'express';
import { authenticate } from '../auth/authenticate';
import { stardustRateLimiter } from '../../middleware/rateLimiters';
import * as DailyRewardsController from './daily-rewards.controller';

const router = Router();

router.get('/status', authenticate, DailyRewardsController.getStatus);
router.post('/claim', stardustRateLimiter, authenticate, DailyRewardsController.claim);

export default router;
