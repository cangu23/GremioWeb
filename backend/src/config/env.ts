import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

const backendDir = path.resolve(__dirname, '../..');

// Load environment variables
dotenv.config({ path: path.join(backendDir, '.env'), override: true });
dotenv.config({ path: path.join(backendDir, '..', '.env') });

function buildAllowedOrigins(): string[] {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const origins = new Set<string>();

  if (frontendUrl) {
    origins.add(frontendUrl.trim().replace(/\/+$/, ''));
  }

  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').forEach((o) => {
      const trimmed = o.trim().replace(/\/+$/, '');
      if (trimmed) origins.add(trimmed);
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    origins.add('http://localhost:3000');
    origins.add('http://localhost:4000');
    origins.add('http://127.0.0.1:3000');
    origins.add('http://127.0.0.1:4000');
  }

  return Array.from(origins);
}

// Zod Schema for Backend Environment Variables
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  BACKEND_URL: z.string().optional().default('http://localhost:4000'),
  JWT_ACCESS_SECRET: z.string().default('dev-secret-access-token-key-12345'),
  JWT_REFRESH_SECRET: z.string().default('dev-secret-refresh-token-key-12345'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  GOOGLE_CLIENT_ID: z.string().default(''),
  DISCORD_CLIENT_ID: z.string().default(''),
  DISCORD_CLIENT_SECRET: z.string().default(''),
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),
  TWITCH_CLIENT_ID: z.string().default(''),
  TWITCH_CLIENT_SECRET: z.string().default(''),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Environment validation failed:', parseResult.error.format());
  throw new Error('Invalid environment configuration');
}

const rawEnv = parseResult.data;

// ── Production security guard ────────────────────────────────────
// Never boot in production with default/dev JWT secrets: tokens
// signed with a known secret can be forged by anyone.
const INSECURE_JWT_SECRETS = [
  'dev-secret-access-token-key-12345',
  'dev-secret-refresh-token-key-12345',
  'change-this-jwt-access-secret-prod',
  'change-this-jwt-refresh-secret-prod',
  'dev-access-secret-change-me',
  'dev-refresh-secret-change-me',
];

if (rawEnv.NODE_ENV === 'production') {
  const accessSecret = rawEnv.JWT_ACCESS_SECRET || '';
  const refreshSecret = rawEnv.JWT_REFRESH_SECRET || '';

  if (accessSecret.length < 32 || INSECURE_JWT_SECRETS.includes(accessSecret)) {
    throw new Error('❌ JWT_ACCESS_SECRET must be set to a strong, unique random value (min 32 chars) in production');
  }
  if (refreshSecret.length < 32 || INSECURE_JWT_SECRETS.includes(refreshSecret)) {
    throw new Error('❌ JWT_REFRESH_SECRET must be set to a strong, unique random value (min 32 chars) in production');
  }
}

const env = {
  ...rawEnv,
  ALLOWED_ORIGINS: buildAllowedOrigins(),
};

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  const cleanOrigin = origin.trim().replace(/\/+$/, '').toLowerCase();

  // 1. Check exact allowed origins from env
  const allowedList = env.ALLOWED_ORIGINS.map((o) => o.trim().replace(/\/+$/, '').toLowerCase());
  if (allowedList.includes(cleanOrigin)) return true;

  // 2. Auto-allow any *.onrender.com origin (Render subdomains)
  if (/^https:\/\/[a-z0-9-]+\.onrender\.com$/.test(cleanOrigin)) {
    return true;
  }

  // 3. Localhost / development origins
  if (env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) {
    return true;
  }

  return false;
}

// Developer Warnings
if (!env.GOOGLE_CLIENT_ID) {
  console.warn('⚠️  GOOGLE_CLIENT_ID not set — Google login disabled');
}
if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) {
  console.warn('⚠️  DISCORD_CLIENT_ID/SECRET not set — Discord login disabled');
}
if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
  console.warn('⚠️  Cloudinary not configured — image uploads will fall back to local disk storage');
}

export type EnvConfig = typeof env;
export default env;
