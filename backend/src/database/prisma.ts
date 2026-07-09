import { PrismaClient } from '@prisma/client';
import path from 'path';

// Resolve absolute path to backend/prisma/dev.db to avoid working directory mismatches
const dbPath = path.resolve(__dirname, '../../prisma/dev.db');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`,
    },
  },
});

export default prisma;