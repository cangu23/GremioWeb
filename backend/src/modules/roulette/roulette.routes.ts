import { Router } from 'express';
import { authenticate } from '../auth/authenticate';
import * as RouletteController from './roulette.controller';

const router = Router();

router.get('/status', authenticate, RouletteController.getStatus);
router.post('/spin', authenticate, RouletteController.spin);
router.get('/history', authenticate, RouletteController.getHistory);

export default router;
