import { Router } from 'express';
import * as FriendsController from './friends.controller';
import { authenticate } from '../auth/authenticate';

const router = Router();

// Friend request actions (protected)
router.post('/request/:userId', authenticate, FriendsController.sendRequest);
router.post('/accept/:userId', authenticate, FriendsController.acceptRequest);
router.post('/reject/:userId', authenticate, FriendsController.rejectRequest);
router.delete('/remove/:userId', authenticate, FriendsController.removeFriend);

// Get friends list (public)
router.get('/list/:userId', FriendsController.getFriends);

// Pending requests for current user (protected)
router.get('/pending', authenticate, FriendsController.getPendingRequests);
router.get('/sent', authenticate, FriendsController.getSentRequests);
router.get('/pending-count', authenticate, FriendsController.getPendingCount);

export default router;
