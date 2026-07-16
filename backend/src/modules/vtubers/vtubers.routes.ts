import { Router } from 'express';
import * as VTubersController from './vtubers.controller';

const router = Router();

// Public endpoint: list approved VTubers with search, filters, pagination
router.get('/', VTubersController.getVtubersDirectory);

// Public endpoint: get featured VTubers with latest posts
router.get('/featured', VTubersController.getFeaturedVtubers);

// Public endpoint: get VTubers currently live
router.get('/live', VTubersController.getLiveVtubers);

export default router;
