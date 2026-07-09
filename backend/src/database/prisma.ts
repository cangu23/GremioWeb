import { PrismaClient } from '@prisma/client';
import path from 'path';

const databaseUrl = process.env.DATABASE_URL;

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

export default prisma;