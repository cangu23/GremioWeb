import { Router } from 'express';
import { Role } from '@gremio-estelar/shared';
import * as NewsController from './news.controller';
import { authenticate } from '../auth/authenticate';
import { optionalAuth } from '../auth/optionalAuth';
import { authorize } from '../auth/authorize';

const router = Router();

// Public routes
router.get('/pinned', NewsController.getPinned);
router.get('/', optionalAuth, NewsController.getAll);
router.get('/:slug', NewsController.getBySlug);

// Admin / Moderator routes — authorize ensures only staff roles reach the controller
router.post('/', authenticate, authorize(Role.ADMIN, Role.MODERATOR, Role.STAFF), NewsController.create);
router.put('/:id', authenticate, authorize(Role.ADMIN, Role.MODERATOR, Role.STAFF), NewsController.update);
router.delete('/:id', authenticate, authorize(Role.ADMIN, Role.MODERATOR, Role.STAFF), NewsController.remove);

export default router;
