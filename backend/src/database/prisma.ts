import { PrismaClient } from '@prisma/client';
import path from 'path';

const BOOT = '[BOOT]';

const databaseUrl = process.env.DATABASE_URL;

console.log(`${BOOT} 📦 Initializing Prisma client...`);
console.log(`${BOOT} DATABASE_URL present: ${databaseUrl ? '✅ YES' : '❌ NO (using SQLite fallback)'}`);

if (databaseUrl) {
  // Log database host without credentials for debugging
  const maskedUrl = databaseUrl.replace(
    /postgresql:\/\/[^:]+:([^@]+)@(.+)/,
    'postgresql://***:***@$2'
  );
  console.log(`${BOOT} Database connection: ${maskedUrl}`);
}

// In production (Render), DATABASE_URL points to PostgreSQL.
// In local dev, fall back to SQLite for zero-config setup.
const prisma = databaseUrl
  ? new PrismaClient() // PrismaClient reads DATABASE_URL from env("DATABASE_URL") in schema.prisma
  : new PrismaClient({
      datasources: {
        db: {
          url: `file:${path.resolve(__dirname, '../../prisma/dev.db')}`,
        },
      },
    });

console.log(`${BOOT} Prisma client instance created ✅`);

// Test database connection on startup (non-blocking)
prisma.$connect()
  .then(() => {
    console.log(`${BOOT} ✅ Database connection established successfully`);
  })
  .catch((err: Error) => {
    console.error(`${BOOT} ❌ Database connection failed:`, err.message);
    console.error(`${BOOT} This will cause issues when querying the database`);
  });

export default prisma;