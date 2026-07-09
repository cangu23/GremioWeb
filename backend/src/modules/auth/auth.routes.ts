import { Router } from 'express';
import * as AuthController from './auth.controller';
import { validateRequest } from './validateRequest';
import { loginSchema, registerSchema, refreshTokenSchema, redeemCodeSchema } from './auth.validation';
import { authenticate } from './authenticate';
import * as CodesController from '../admin/codes.controller';
import * as GoogleController from './google.controller';
import * as DiscordController from './discord.controller';

const router = Router();

// All routes in this file are prefixed with /api/auth

router.post('/login', validateRequest(loginSchema), AuthController.login);
router.post('/register', validateRequest(registerSchema), AuthController.register);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

// 🔐 Redeem an invitation code (authenticated users)
router.post('/redeem-code', authenticate, validateRequest(redeemCodeSchema), CodesController.redeemCode);

// 🔵 Google OAuth (Google Identity Services)
router.post('/google', GoogleController.googleLogin);

// 🎮 Discord OAuth
router.get('/discord', DiscordController.redirectToDiscord);
router.get('/discord/callback', DiscordController.handleDiscordCallback);

export default router;