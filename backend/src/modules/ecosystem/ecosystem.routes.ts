import { Router } from 'express';
import { authenticate } from '../auth/authenticate';
import * as EcosystemController from './ecosystem.controller';

const router = Router();

// Public / Plan info
router.get('/plans', EcosystemController.getAllPlans);

// Protected routes
router.use(authenticate);

router.get('/stardust', EcosystemController.getStardust);
router.get('/missions', EcosystemController.getMissions);
router.post('/missions/:id/claim', EcosystemController.claimMission);

router.get('/plan', EcosystemController.getPlatformPlan);
router.post('/plan/activate', EcosystemController.activatePlan);
router.post('/plan/cancel', EcosystemController.cancelPlan);

router.get('/titles', EcosystemController.getUserTitles);
router.post('/titles/equip', EcosystemController.equipTitle);

router.get('/pass', EcosystemController.getSeasonPass);
router.post('/pass/claim', EcosystemController.claimPassLevel);

export default router;
