import { Router } from 'express';
import * as NewsController from './news.controller';
import { authenticate } from '../auth/authenticate';
import { optionalAuth } from '../auth/optionalAuth';

const router = Router();

// Public routes
router.get('/pinned', NewsController.getPinned);
router.get('/', optionalAuth, NewsController.getAll);
router.get('/:slug', NewsController.getBySlug);

// Admin / Moderator routes
router.post('/', authenticate, NewsController.create);
router.put('/:id', authenticate, NewsController.update);
router.delete('/:id', authenticate, NewsController.remove);

export default router;
