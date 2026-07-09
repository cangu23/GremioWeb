import { Router } from 'express';
import * as SocialController from './social.controller';
import { authenticate } from '../auth/authenticate';
import { optionalAuth } from '../auth/optionalAuth';

const router = Router();

// Follow / Unfollow (protected)
router.post('/follow/:followingId', authenticate, SocialController.follow);
router.post('/unfollow/:followingId', authenticate, SocialController.unfollow);

// Social profile (public, but detects isFollowedByMe if authenticated)
router.get('/profile/:id', optionalAuth, SocialController.getSocialProfile);

// Followers / Following lists (public)
router.get('/followers/:id', SocialController.getFollowers);
router.get('/following/:id', SocialController.getFollowing);

export default router;
