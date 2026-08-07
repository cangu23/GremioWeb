import { Router } from 'express';
import { authenticate } from '../auth/authenticate';
import { optionalAuth } from '../auth/optionalAuth';
import * as GamificationController from './gamification.controller';

import { authorize } from '../auth/authorize';

const router = Router();

// Public
router.get('/achievements', optionalAuth, GamificationController.getAllAchievements);
router.get('/leaderboard', optionalAuth, GamificationController.getLeaderboard);

// Protected
router.get('/me', authenticate, GamificationController.getMyProfile);
// NOTE: POST /xp was removed — it let clients award XP for arbitrary actions
// without server-side verification (XP farm -> levels -> pass rewards). XP is
// awarded server-side from the real action endpoints instead.
router.post('/stream-xp', authenticate, GamificationController.awardStreamXp);

// Admin - manual award & seed achievements
router.post('/award-manual', authenticate, authorize(['ADMIN', 'MODERATOR', 'STAFF', 'MOD', 'OWNER'] as any), GamificationController.awardManualAchievement);
router.post('/seed', authenticate, GamificationController.seed);

export default router;
