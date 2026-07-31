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

  origins.add(frontendUrl);

  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').forEach((o) => {
      const trimmed = o.trim();
      if (trimmed) origins.add(trimmed);
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    origins.add('http://localhost:3000');
    origins.add('http://localhost:4000');
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

const env = {
  ...rawEnv,
  ALLOWED_ORIGINS: buildAllowedOrigins(),
};

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

