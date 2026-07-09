import { z } from 'zod';

// --- Zod Schemas ---
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

// Kept for backwards-compat if still referenced elsewhere
export const refreshRequestSchema = z.object({
  body: z.object({ refreshToken: z.string() }),
});

export const logoutRequestSchema = z.object({
  body: z.object({ refreshToken: z.string() }),
});

// --- TypeScript Interfaces ---
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    status: string;
  };
}