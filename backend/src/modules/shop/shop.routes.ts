import { Router } from 'express';
import { Role } from '@gremio-estelar/shared';
import { authenticate } from '../auth/authenticate';
import { optionalAuth } from '../auth/optionalAuth';
import { authorize } from '../auth/authorize';
import * as ShopController from './shop.controller';

const router = Router();

// Public
router.get('/items', optionalAuth, ShopController.listItems);

// Protected
router.get('/inventory', authenticate, ShopController.getInventory);
router.post('/buy/:itemId', authenticate, ShopController.buyItem);
router.post('/equip/:itemId', authenticate, ShopController.equipItem);
router.post('/use/:itemId', authenticate, ShopController.useConsumable);

// Badge display (public)
router.get('/badge/:userId', optionalAuth, ShopController.getUserEquippedBadge);

// Admin - seed items
router.post('/seed', authenticate, authorize(Role.ADMIN), ShopController.seedItems);

export default router;
