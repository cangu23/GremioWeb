import { Router } from 'express';
import { Role } from '@gremio-estelar/shared';
import { authenticate } from '../auth/authenticate';
import { authorize } from '../auth/authorize';
import * as WarningsController from './warnings.controller';

const router = Router();

// All warning routes require ADMIN role
router.use(authenticate, authorize(Role.ADMIN));

router.post('/issue', WarningsController.issueWarning);
router.get('/user/:userId', WarningsController.getUserWarnings);
router.get('/', WarningsController.listWarnings);

// Message & feed deletion (admin)
router.delete('/chat-message', WarningsController.deleteChatMessage);
router.delete('/feed-post', WarningsController.deleteFeedPost);

export default router;
