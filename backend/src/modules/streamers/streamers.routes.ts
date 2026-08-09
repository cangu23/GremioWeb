import { Router } from 'express';
import * as StreamersController from './streamers.controller';
import { authenticate } from '../auth/authenticate';

const router = Router();

// Public endpoint: list approved streamers with search, filters, pagination
router.get('/', StreamersController.getStreamersDirectory);

// Public endpoint: get featured streamers with latest posts
router.get('/featured', StreamersController.getFeaturedStreamers);

// Public endpoint: get streamers currently live
router.get('/live', StreamersController.getLiveStreamers);

// Authenticated: the streamer's own profile (editor)
router.get('/me', authenticate, StreamersController.getMyStreamerProfile);
router.patch('/me', authenticate, StreamersController.updateMyStreamerProfile);

export default router;
