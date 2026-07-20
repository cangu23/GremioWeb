import { Router } from 'express';
import * as UserController from './user.controller';
import { validateRequest } from '../auth/validateRequest';
import { authenticate } from '../auth/authenticate';
import { updateUserSchema, updateNoteSchema } from './user.validation';

const router = Router();

// Protected routes
router.get('/me', authenticate, UserController.getMe);
router.patch('/me', authenticate, validateRequest(updateUserSchema), UserController.updateMe);

// Note (Instagram-style) — authenticated
router.put('/note', authenticate, validateRequest(updateNoteSchema), UserController.updateNote);

// Public routes
router.get('/search', UserController.searchUsers);
router.get('/search/mentions', UserController.searchUsersForMention);
router.get('/role/:role', UserController.getUsersByRole);
router.get('/:id', UserController.getPublicUser);

export default router;
