import { PrismaClient } from '@prisma/client';
import path from 'path';
import { createLogger } from '../utils/logger';

const log = createLogger('DATABASE');
const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl) {
  const maskedUrl = databaseUrl.replace(
    /postgresql:\/\/[^:]+:([^@]+)@(.+)/,
    'postgresql://***:***@$2'
  );
  log.info(`Connecting to PostgreSQL: ${maskedUrl}`);
} else {
  log.info('DATABASE_URL not set — using local SQLite fallback');
}

// In production (Render), DATABASE_URL points to PostgreSQL.
// In local dev, fall back to SQLite for zero-config setup.
const prisma = databaseUrl
  ? new PrismaClient()
  : new PrismaClient({
      datasources: {
        db: {
          url: `file:${path.resolve(__dirname, '../../prisma/dev.db')}`,
        },
      },
    });

// Test database connection on startup (non-blocking)
prisma.$connect()
  .then(() => {
    log.info('Database connection established successfully');
  })
  .catch((err: Error) => {
    log.error(`Database connection failed: ${err.message}`);
  });

export default prisma;