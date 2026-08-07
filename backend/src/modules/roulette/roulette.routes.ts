import { Router } from 'express';
import { authenticate } from '../auth/authenticate';
import { stardustRateLimiter } from '../../middleware/rateLimiters';
import * as RouletteController from './roulette.controller';

const router = Router();

router.get('/status', authenticate, RouletteController.getStatus);
router.post('/spin', stardustRateLimiter, authenticate, RouletteController.spin);
router.post('/spin-stardust', stardustRateLimiter, authenticate, RouletteController.spinWithStardust);
router.get('/stats', authenticate, RouletteController.getStats);
router.get('/history', authenticate, RouletteController.getHistory);

export default router;
