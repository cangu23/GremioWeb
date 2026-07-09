import { Router } from 'express';
import { authenticate } from '../auth/authenticate';
import { optionalAuth } from '../auth/optionalAuth';
import * as GamificationController from './gamification.controller';

const router = Router();

// Public
router.get('/achievements', optionalAuth, GamificationController.getAllAchievements);
router.get('/leaderboard', optionalAuth, GamificationController.getLeaderboard);

// Protected
router.get('/me', authenticate, GamificationController.getMyProfile);
router.post('/xp', authenticate, GamificationController.awardXp);

// Admin - seed achievements
router.post('/seed', authenticate, GamificationController.seed);

export default router;
