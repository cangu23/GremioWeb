import { Router } from 'express';
import * as AuthController from './auth.controller';
import { validateRequest } from './validateRequest';
import { loginSchema, registerSchema, refreshTokenSchema } from './auth.validation';
import { authenticate } from './authenticate';

const router = Router();

// All routes in this file are prefixed with /api/auth

router.post('/login', validateRequest(loginSchema), AuthController.login);
router.post('/register', validateRequest(registerSchema), AuthController.register);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

export default router;