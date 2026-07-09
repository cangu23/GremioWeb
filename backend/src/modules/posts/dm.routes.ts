import { Router } from 'express';
import { authenticate } from '../auth/authenticate';
import * as PostsController from './posts.controller';

const router = Router();

router.use(authenticate);

router.get('/conversations', PostsController.getConversations);
router.get('/conversations/:userId', PostsController.getConversation);
router.get('/unread-count', PostsController.getUnreadDmCount);
router.post('/send', PostsController.sendMessage);

export default router;
