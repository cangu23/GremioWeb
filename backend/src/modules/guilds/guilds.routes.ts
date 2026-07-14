import { Router } from 'express';
import * as GuildsController from './guilds.controller';
import { authenticate } from '../auth/authenticate';
import { optionalAuth } from '../auth/optionalAuth';
import channelsRouter from './channels.routes';

const router = Router();

// My guilds (MUST be before /:id)
router.get('/my/guilds', authenticate, GuildsController.getMyGuilds);

// Public routes
router.get('/', optionalAuth, GuildsController.getAll);
router.get('/:id', optionalAuth, GuildsController.getById);

// Protected routes
router.post('/', authenticate, GuildsController.create);
router.put('/:id', authenticate, GuildsController.update);
router.delete('/:id', authenticate, GuildsController.remove);

// Membership
router.post('/:id/join', authenticate, GuildsController.join);
router.post('/:id/leave', authenticate, GuildsController.leave);
router.delete('/:id/members/:userId', authenticate, GuildsController.kickMember);
router.put('/:id/members/:userId/role', authenticate, GuildsController.changeMemberRole);

// Channels (nested under guild)
router.use('/:guildId/channels', channelsRouter);

export default router;
