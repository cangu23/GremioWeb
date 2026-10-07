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

/* ========================================================
 * REGLA DE ESQUEMA Y SEED (fuente única)
 * ========================================================
 * - En desarrollo local y entornos nuevos, la forma oficial de
 *   crear/actualizar tablas es Prisma Migrate.
 *   Comandos típicos:
 *     npx prisma migrate dev --schema backend/prisma/schema.prisma --name <name>
 *     npx prisma migrate deploy --schema backend/prisma/schema.prisma
 *
 * - En producción histórica, el esquema llegó con `prisma db push`
 *   (sin historial de migraciones). En ese caso el servidor usa un
 *   mecanismo de compatibilidad en `start.sh` (baseline + migrate
 *   deploy + fallback db push) para no romper el boot.
 *
 * - Seed mínimo oficial: `npx ts-node backend/src/scripts/seed-minimum.ts`
 *   (o `npm run db:seed:minimum` si se añade al package.json).
 *   Garantiza admin mínimo, shop items mínimos, logros mínimos,
 *   misiones mínimas y temporada + niveles mínimos del pase.
 *   Está pensado para resets/entornos nuevos, no para correr en
 *   producción continua.
 *
 * - Regla práctica: si creas una tabla/modelo nuevo, usa Migrate
 *   y documenta en el commit qué endpoints lo usan. Mantén el seed
 *   mínimo actualizado si el nuevo elemento es indispensable para
 *   que la app no quede rota tras un reset (ej. un item de tienda,
 *   un logro, una misión o niveles de pase que la UI liste).
 */
export default prisma;