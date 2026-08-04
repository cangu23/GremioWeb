import { z } from 'zod';

// This file will contain Zod schemas for validating
// incoming request bodies for the auth module.

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Formato de correo electrónico inválido'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Formato de correo electrónico inválido'),
    username: z
      .string()
      .min(3, 'El nombre de usuario debe tener al menos 3 caracteres'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    ref: z.string().optional(),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string({ required_error: 'Refresh token is required' }),
  }),
});

export const redeemCodeSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'El código es requerido'),
  }),
});