import { Router } from 'express';
import { optionalAuth } from '../auth/optionalAuth';
import * as ChatController from './chat.controller';

const router = Router();

router.get('/history', optionalAuth, ChatController.getHistory);

export default router;
