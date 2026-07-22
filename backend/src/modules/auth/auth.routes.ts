import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as AuthController from './auth.controller';
import { validateRequest } from './validateRequest';
import { loginSchema, registerSchema, refreshTokenSchema, redeemCodeSchema } from './auth.validation';
import { authenticate } from './authenticate';
import * as CodesController from '../admin/codes.controller';
import * as GoogleController from './google.controller';
import * as DiscordController from './discord.controller';

const router = Router();

// Rate limiter: máximo 10 intentos de login por IP cada 15 minutos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: { message: 'Demasiados intentos de inicio de sesión. Inténtalo de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter: máximo 5 registros por IP por hora
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  message: { message: 'Demasiadas cuentas creadas desde esta IP. Inténtalo más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// All routes in this file are prefixed with /api/auth

router.post('/login', loginLimiter, validateRequest(loginSchema), AuthController.login);
router.post('/register', registerLimiter, validateRequest(registerSchema), AuthController.register);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

// Redeem an invitation code (authenticated users)
router.post('/redeem-code', authenticate, validateRequest(redeemCodeSchema), CodesController.redeemCode);

// 🔵 Google OAuth (Google Identity Services)
router.post('/google', GoogleController.googleLogin);

// Discord OAuth
router.get('/discord', DiscordController.redirectToDiscord);
router.get('/discord/callback', DiscordController.handleDiscordCallback);

export default router;