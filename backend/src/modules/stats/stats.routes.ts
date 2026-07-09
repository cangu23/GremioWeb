import { Router } from 'express';
import * as StatsController from './stats.controller';

const router = Router();

// Public stats endpoint for the landing page
router.get('/', StatsController.getPublicStats);

export default router;
