import dotenv from 'dotenv';
import path from 'path';

// __dirname is either backend/src/config (ts-node-dev) or backend/dist/config (compiled)
// Going up 2 levels always lands us inside the backend/ directory
const backendDir = path.resolve(__dirname, '../..');

// Load backend/.env first (highest priority), then root .env as fallback
dotenv.config({ path: path.join(backendDir, '.env') });
dotenv.config({ path: path.join(backendDir, '..', '.env') }); // root .env fallback


interface EnvConfig {
  PORT: number;
  FRONTEND_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
}

const env: EnvConfig = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || '',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};

// Validate required secrets (must be set via .env, never use defaults in production)
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
