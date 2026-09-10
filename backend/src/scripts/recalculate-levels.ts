/**
 * recalculate-levels.ts
 * ──────────────────────────────────────────────────────────
 * Migración one-off: sincroniza el nivel almacenado de cada usuario
 * con su XP real usando la tabla oficial LEVEL_XP_THRESHOLDS de shared.
 *
 * Corrige usuarios cuyo `level` quedó desincronizado (p. ej. ajustado a
 * mano o calculado con una curva de niveles anterior), lo que rompía el
 * orden de la Clasificación Estelar: el ranking ordena por XP, pero un
 * "Nivel 50 con 12.251 XP" junto a un "Nivel 33 con 34.263 XP" no cuadra.
 *
 * Uso (desde backend/):
 *   npx ts-node src/scripts/recalculate-levels.ts            # aplica cambios
 *   npx ts-node src/scripts/recalculate-levels.ts --dry-run  # solo reporta
 * ──────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { getLevelFromXp } from '@gremio-estelar/shared';

const prisma = new PrismaClient();

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log('');
  console.log('🔧 Recalculando niveles según XP real');
  console.log('══════════════════════════════════════════');
  console.log(`Modo: ${isDryRun ? 'DRY-RUN (sin cambios)' : 'APLICAR CAMBIOS'}`);
  console.log('');

  const users = await prisma.user.findMany({
    select: { id: true, username: true, xp: true, level: true },
  });

  let fixed = 0;

  for (const user of users) {
    const correctLevel = getLevelFromXp(user.xp);
    if (correctLevel === user.level) continue;

    fixed++;
    const direction = correctLevel > user.level ? '⬆️  subir' : '⬇️  bajar';
    console.log(
      `${direction} @${user.username}: nivel ${user.level} → ${correctLevel} (${user.xp.toLocaleString()} XP)`
    );

    if (!isDryRun) {
      await prisma.user.update({
        where: { id: user.id },
        data: { level: correctLevel },
      });
    }
  }

  console.log('');
  console.log(`Usuarios revisados: ${users.length}`);
  if (isDryRun) {
    console.log(`⚠️  DRY-RUN finalizado — ${fixed} usuario(s) desincronizado(s), no se aplicó nada.`);
    console.log('   Ejecuta sin --dry-run para aplicarlos.');
  } else {
    console.log(`🎉 Listo — ${fixed} usuario(s) corregido(s).`);
  }
  console.log('');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
