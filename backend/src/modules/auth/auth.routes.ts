import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as AuthController from './auth.controller';
import { validateRequest } from './validateRequest';
import { loginSchema, registerSchema, redeemCodeSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.validation';
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

// Rate limiter: máximo 60 renovaciones de token por IP cada 15 minutos
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 60,
  message: { message: 'Demasiadas solicitudes de renovación de sesión. Inténtalo más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter: máximo 30 cierres de sesión por IP cada 15 minutos
const logoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30,
  message: { message: 'Demasiadas solicitudes de cierre de sesión. Inténtalo más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter anti fuerza-bruta para códigos de activación: máx 5 intentos cada 15 min
const redeemLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Demasiados intentos de canje de código. Por seguridad, inténtalo de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para recuperación de contraseña: máx 5 solicitudes cada 15 min
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Demasiadas solicitudes de recuperación de contraseña. Por seguridad, inténtalo de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// All routes in this file are prefixed with /api/auth

router.post('/login', loginLimiter, validateRequest(loginSchema), AuthController.login);
router.post('/register', registerLimiter, validateRequest(registerSchema), AuthController.register);
router.post('/refresh', refreshLimiter, AuthController.refresh);
router.post('/logout', logoutLimiter, AuthController.logout);

// Recuperación y restablecimiento de contraseña
router.post('/forgot-password', passwordResetLimiter, validateRequest(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, validateRequest(resetPasswordSchema), AuthController.resetPassword);

// Redeem an invitation code (authenticated users)
router.post('/redeem-code', authenticate, redeemLimiter, validateRequest(redeemCodeSchema), CodesController.redeemCode);

// 🔵 Google OAuth (Google Identity Services con loginLimiter)
router.post('/google', loginLimiter, GoogleController.googleLogin);

// Discord OAuth
router.get('/discord', DiscordController.redirectToDiscord);
router.get('/discord/callback', DiscordController.handleDiscordCallback);

export default router;
