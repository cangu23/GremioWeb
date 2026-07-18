import { Router } from 'express';
import { authenticate } from '../auth/authenticate';
import * as DailyRewardsController from './daily-rewards.controller';

const router = Router();

router.get('/status', authenticate, DailyRewardsController.getStatus);
router.post('/claim', authenticate, DailyRewardsController.claim);

export default router;
