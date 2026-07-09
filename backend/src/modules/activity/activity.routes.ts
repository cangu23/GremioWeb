import { Router } from 'express';
import * as ActivityController from './activity.controller';

const router = Router();

// Public activity feed for the landing page
router.get('/', ActivityController.getRecentActivity);

export default router;
