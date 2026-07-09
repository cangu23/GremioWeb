import { Router } from 'express';
import * as AuthController from './auth.controller';
import { validateRequest } from './validateRequest';
import { loginSchema, registerSchema, refreshTokenSchema, redeemCodeSchema } from './auth.validation';
import { authenticate } from './authenticate';
import * as CodesController from '../admin/codes.controller';

const router = Router();

// All routes in this file are prefixed with /api/auth

router.post('/login', validateRequest(loginSchema), AuthController.login);
router.post('/register', validateRequest(registerSchema), AuthController.register);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

// 🔐 Redeem an invitation code (authenticated users)
router.post('/redeem-code', authenticate, validateRequest(redeemCodeSchema), CodesController.redeemCode);

export default router;