import { z } from 'zod';

// This file contains Zod schemas for validating
// incoming request bodies for the auth module.

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Formato de correo electrónico inválido'),
    password: z
      .string()
      .min(1, 'La contraseña es requerida'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Formato de correo electrónico inválido').max(254),
    username: z
      .string()
      .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
      .max(30, 'El nombre de usuario no puede tener más de 30 caracteres')
      .regex(/^[a-zA-Z0-9_]+$/, 'El nombre de usuario solo puede contener letras, números y guiones bajos'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(128, 'La contraseña no puede tener más de 128 caracteres')
      .regex(/[A-Z]/, 'La contraseña debe tener al menos una letra mayúscula')
      .regex(/[a-z]/, 'La contraseña debe tener al menos una letra minúscula')
      .regex(/[0-9]/, 'La contraseña debe tener al menos un número'),
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

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Formato de correo electrónico inválido').max(254),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'El token de recuperación es requerido'),
    newPassword: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
      .max(128, 'La nueva contraseña no puede tener más de 128 caracteres')
      .regex(/[A-Z]/, 'La contraseña debe tener al menos una letra mayúscula')
      .regex(/[a-z]/, 'La contraseña debe tener al menos una letra minúscula')
      .regex(/[0-9]/, 'La contraseña debe tener al menos un número'),
  }),
});
