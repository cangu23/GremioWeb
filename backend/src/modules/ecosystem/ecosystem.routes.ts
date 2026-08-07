import { Router } from 'express';
import { authenticate } from '../auth/authenticate';
import { stardustRateLimiter } from '../../middleware/rateLimiters';
import * as EcosystemController from './ecosystem.controller';
import * as PetRequestsController from './pet-requests.controller';

const router = Router();

// Public / Plan info
router.get('/plans', EcosystemController.getAllPlans);

// Protected routes
router.use(authenticate);

router.get('/stardust', EcosystemController.getStardust);
router.get('/stardust/balance', EcosystemController.getStardustBalance);
router.post('/stardust/transfer', stardustRateLimiter, EcosystemController.transferStardust);
router.post('/stardust/admin-grant', stardustRateLimiter, EcosystemController.grantAdminStardust);
router.post('/stardust/gift-plan', stardustRateLimiter, EcosystemController.giftPlan);

router.get('/missions', EcosystemController.getMissions);
// NOTE: POST /missions/track was removed — it let clients complete daily
// missions (and earn Stardust) without performing the real action. Progress is
// now tracked server-side from the actual action endpoints (posts, social,
// shop, events, pets, daily-login, etc.).
router.post('/missions/claim-all', EcosystemController.claimAllMissions);
router.post('/missions/:id/claim', EcosystemController.claimMission);

router.get('/plan', EcosystemController.getPlatformPlan);
router.post('/plan/activate', EcosystemController.activatePlan);
router.post('/plan/cancel', EcosystemController.cancelPlan);

router.get('/titles', EcosystemController.getUserTitles);
router.post('/titles/equip', EcosystemController.equipTitle);

router.get('/pass', EcosystemController.getSeasonPass);
router.post('/pass/claim-all', stardustRateLimiter, EcosystemController.claimAllPassLevels);
router.post('/pass/claim', stardustRateLimiter, EcosystemController.claimPassLevel);
router.post('/pass/buy-premium', stardustRateLimiter, EcosystemController.buyPremiumWithStardust);
router.post('/pass/skip-level', stardustRateLimiter, EcosystemController.skipPassLevelWithStardust);

router.post('/chest/open', stardustRateLimiter, EcosystemController.openMysteryChest);

router.get('/streak', EcosystemController.getDailyStreak);
router.get('/community-challenge', EcosystemController.getCommunityChallenge);

// Pet Requests (User)
router.post('/pet-requests', PetRequestsController.createPetRequest);
router.get('/pet-requests/my', PetRequestsController.getMyPetRequests);

export default router;
