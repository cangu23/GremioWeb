import dotenv from 'dotenv';
import path from 'path';

// __dirname is either backend/src/config (ts-node-dev) or backend/dist/config (compiled)
// Going up 2 levels always lands us inside the backend/ directory
const backendDir = path.resolve(__dirname, '../..');

// Load backend/.env with override=true to take precedence over pre-existing env vars
dotenv.config({ path: path.join(backendDir, '.env'), override: true });
// Load root .env as fallback (lower priority)
dotenv.config({ path: path.join(backendDir, '..', '.env') });


interface EnvConfig {
  PORT: number;
  FRONTEND_URL: string;
  BACKEND_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  GOOGLE_CLIENT_ID: string;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  TWITCH_CLIENT_ID: string;
  TWITCH_CLIENT_SECRET: string;
}

const env: EnvConfig = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || '',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || '',
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET || '',
  BACKEND_URL: process.env.BACKEND_URL || `http://localhost:${parseInt(process.env.PORT || '4000', 10)}`,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID || '',
  TWITCH_CLIENT_SECRET: process.env.TWITCH_CLIENT_SECRET || '',
};

// Validate required secrets (must be set via .env, never use defaults in production)
// Warn if OAuth providers are not configured
if (!env.GOOGLE_CLIENT_ID) {
  console.warn('⚠️  GOOGLE_CLIENT_ID not set — Google login disabled');
}
if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) {
  console.warn('⚠️  DISCORD_CLIENT_ID/SECRET not set — Discord login disabled');
}

if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
  console.warn('⚠️  Cloudinary not configured — image uploads will fail');
}

if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) {
  console.warn('⚠️  TWITCH_CLIENT_ID/SECRET not set — automatic live detection disabled');
}

if (isNaN(env.PORT) || !env.JWT_ACCESS_SECRET || !env.JWT_REFRESH_SECRET) {
  console.error(
    'Missing required environment variables.\n' +
    'Ensure JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are set in your .env file.\n' +
    'Example:\n' +
    '  JWT_ACCESS_SECRET=your-strong-secret\n' +
    '  JWT_REFRESH_SECRET=your-strong-secret'
  );
  throw new Error('One or more required environment variables are not defined or invalid.');
}

export default env;
