/**
 * heal-legacy-vtubers.ts
 * ──────────────────────────────────────────────────────────
 * Migración one-off: reproduce la lógica de "auto-heal" que antes vivía en
 * el endpoint público GET /api/vtubers (eliminada en producción porque hacía
 * escrituras en un GET y auto-verificaba perfiles sin revisión humana).
 *
 * Uso (desde backend/):
 *   npx ts-node src/scripts/heal-legacy-vtubers.ts            # aplica cambios
 *   npx ts-node src/scripts/heal-legacy-vtubers.ts --dry-run  # solo reporta
 *
 * Qué hace:
 *   1. Crea VTuberProfile (isApproved, isVerified) para usuarios con rol
 *      VTUBER que aún no tienen perfil.
 *   2. Asegura el rol VTUBER (append) para los usernames conocidos.
 *   3. Auto-aprueba perfiles con displayName de usuarios con rol VTUBER.
 * ──────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Usuarios legacy que deben conservar el rol VTUBER.
const LEGACY_VTUBER_USERNAMES = ['canguvt', 'aleshaW', 'yusuki_yukihira', 'hoshi'];

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log('');
  console.log('🩺 Sanación de datos legacy de VTubers');
  console.log('══════════════════════════════════════════');
  console.log(`Modo: ${isDryRun ? 'DRY-RUN (sin cambios)' : 'APLICAR CAMBIOS'}`);
  console.log('');

  let changes = 0;

  // 1. Crear perfiles para VTubers huérfanos
  const orphanVtubers = await prisma.user.findMany({
    where: { role: { contains: 'VTUBER' }, vtuberProfile: null },
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  });

  if (orphanVtubers.length > 0) {
    console.log(`📦 ${orphanVtubers.length} usuario(s) con rol VTUBER sin perfil:`);
    for (const orphan of orphanVtubers) {
      console.log(`   - @${orphan.username} → creando perfil "${orphan.displayName || orphan.username}"`);
      if (!isDryRun) {
        await prisma.vTuberProfile.create({
          data: {
            userId: orphan.id,
            displayName: orphan.displayName || orphan.username,
            avatarUrl: orphan.avatarUrl || null,
            isApproved: true,
            isHidden: false,
            isVerified: true,
          },
        }).catch((err) => console.warn(`     ⚠️  ${err.message}`));
      }
    }
    changes += orphanVtubers.length;
  }

  // 2. Asegurar rol VTUBER en usernames legacy
  const vtubersToEnsure = await prisma.user.findMany({
    where: { username: { in: LEGACY_VTUBER_USERNAMES } },
    select: { id: true, username: true, role: true },
  });

  for (const u of vtubersToEnsure) {
    const roles = u.role.split(',').map((r) => r.trim()).filter(Boolean);
    if (!roles.includes('VTUBER')) {
      console.log(`🎭 @${u.username} → agregando rol VTUBER a "${u.role}"`);
      if (!isDryRun) {
        await prisma.user.update({
          where: { id: u.id },
          data: { role: `${u.role},VTUBER` },
        });
      }
      changes++;
    }
  }

  // 3. Auto-aprobar perfiles válidos de VTubers
  const toApprove = await prisma.vTuberProfile.findMany({
    where: {
      displayName: { not: '' },
      user: { role: { contains: 'VTUBER' } },
      OR: [{ isApproved: false }, { isHidden: true }],
    },
    select: { id: true, displayName: true },
  });

  if (toApprove.length > 0) {
    console.log(`✅ ${toApprove.length} perfil(es) por aprobar/desocultar`);
    if (!isDryRun) {
      await prisma.vTuberProfile.updateMany({
        where: { id: { in: toApprove.map((p) => p.id) } },
        data: { isApproved: true, isHidden: false },
      });
    }
    changes += toApprove.length;
  }

  console.log('');
  if (isDryRun) {
    console.log(`⚠️  DRY-RUN finalizado — ${changes} cambio(s) pendientes, no se aplicó nada.`);
    console.log('   Ejecuta sin --dry-run para aplicarlos.');
  } else {
    console.log(`🎉 Listo — ${changes} cambio(s) aplicado(s).`);
  }
  console.log('');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
