import { PrismaClient } from '@prisma/client';
import path from 'path';
import { createLogger } from '../utils/logger';

const log = createLogger('DATABASE');
const databaseUrl = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

// Fail fast in production: silently falling back to SQLite would cause
// silent data loss (writes would go to an ephemeral local file).
if (isProduction && !databaseUrl) {
  throw new Error(
    '❌ DATABASE_URL is required in production. Set it to your PostgreSQL connection ' +
      'string (postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public). ' +
      'Refusing to start with the SQLite fallback in production.'
  );
}

if (databaseUrl) {
  const maskedUrl = databaseUrl.replace(
    /postgresql:\/\/[^:]+:([^@]+)@(.+)/,
    'postgresql://***:***@$2'
  );
  log.info(`Connecting to PostgreSQL: ${maskedUrl}`);
} else {
  log.info('DATABASE_URL not set — using local SQLite fallback (development only)');
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

// Test database connection on startup.
// In production, a failed connection is fatal (fail-fast): booting without a
// reachable DB would leave the API returning 500s on every query.
prisma.$connect()
  .then(() => {
    log.info('Database connection established successfully');
  })
  .catch((err: Error) => {
    log.error(`Database connection failed: ${err.message}`);
    if (isProduction) {
      log.error('❌ Refusing to start in production with an unreachable database.');
      process.exit(1);
    }
  });

export default prisma;