import { Router } from 'express';
import * as VTubersController from './vtubers.controller';

const router = Router();

// Public endpoint: get featured VTubers with latest posts
router.get('/featured', VTubersController.getFeaturedVtubers);

export default router;
