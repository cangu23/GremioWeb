import { Router } from 'express';
import { authenticate } from '../auth/authenticate';
import * as EcosystemController from './ecosystem.controller';

const router = Router();

// Public / Plan info
router.get('/plans', EcosystemController.getAllPlans);

// Protected routes
router.use(authenticate);

router.get('/stardust', EcosystemController.getStardust);
router.get('/stardust/balance', EcosystemController.getStardustBalance);
router.post('/stardust/transfer', EcosystemController.transferStardust);
router.post('/stardust/gift-plan', EcosystemController.giftPlan);

router.get('/missions', EcosystemController.getMissions);
router.post('/missions/claim-all', EcosystemController.claimAllMissions);
router.post('/missions/:id/claim', EcosystemController.claimMission);

router.get('/plan', EcosystemController.getPlatformPlan);
router.post('/plan/activate', EcosystemController.activatePlan);
router.post('/plan/cancel', EcosystemController.cancelPlan);

router.get('/titles', EcosystemController.getUserTitles);
router.post('/titles/equip', EcosystemController.equipTitle);

router.get('/pass', EcosystemController.getSeasonPass);
router.post('/pass/claim-all', EcosystemController.claimAllPassLevels);
router.post('/pass/claim', EcosystemController.claimPassLevel);
router.post('/pass/buy-premium', EcosystemController.buyPremiumWithStardust);
router.post('/pass/skip-level', EcosystemController.skipPassLevelWithStardust);

router.post('/chest/open', EcosystemController.openMysteryChest);

router.get('/streak', EcosystemController.getDailyStreak);
router.get('/community-challenge', EcosystemController.getCommunityChallenge);

export default router;
