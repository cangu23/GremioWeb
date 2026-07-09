import { z } from 'zod';
import { loginSchema, registerSchema, refreshTokenSchema } from './auth.validation';

// This file is for types that are internal to the auth module
// and are not shared with the frontend or other backend modules.

export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];