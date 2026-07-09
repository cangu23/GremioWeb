import { Router } from 'express';
import * as EventsController from './events.controller';
import { authenticate } from '../auth/authenticate';
import { optionalAuth } from '../auth/optionalAuth';

const router = Router();

// My events (MUST be before /:id to avoid route conflict)
router.get('/my/events', authenticate, EventsController.getMyEvents);

// Public routes
router.get('/', optionalAuth, EventsController.getAll);
router.get('/:id', optionalAuth, EventsController.getById);

// Protected routes
router.post('/', authenticate, EventsController.create);
router.put('/:id', authenticate, EventsController.update);
router.delete('/:id', authenticate, EventsController.remove);

// Attendance (protected)
router.post('/:id/attend', authenticate, EventsController.attend);
router.post('/:id/unattend', authenticate, EventsController.unattend);

export default router;
