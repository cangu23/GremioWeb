import { Router } from 'express';
import * as UserController from './user.controller';
import { validateRequest } from '../auth/validateRequest';
import { authenticate } from '../auth/authenticate';
import { updateUserSchema } from './user.validation';

const router = Router();

// Protected routes
router.get('/me', authenticate, UserController.getMe);
router.patch('/me', authenticate, validateRequest(updateUserSchema), UserController.updateMe);

// Public routes
router.get('/search', UserController.searchUsers);
router.get('/role/:role', UserController.getUsersByRole);
router.get('/:id', UserController.getPublicUser);

export default router;
