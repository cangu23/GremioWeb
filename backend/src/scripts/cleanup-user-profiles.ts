/**
 * cleanup-user-profiles.ts
 * ──────────────────────────────────────────────────────────
 * One-time migration: elimina VTuberProfiles de usuarios
 * que tienen role = 'USER' (es decir, NO son VTubers oficiales)
 * pero que tienen un perfil VTuber creado automáticamente
 * por Discord/Google login antes del fix.
 *
 * Uso:
 *   cd backend
 *   npx ts-node src/scripts/cleanup-user-profiles.ts
 *
 * Para ver solo un dry-run sin eliminar:
 *   npx ts-node src/scripts/cleanup-user-profiles.ts --dry-run
 * ──────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log('');
  console.log('🧹 Limpieza de VTuberProfiles para usuarios role USER');
  console.log('══════════════════════════════════════════════════════');
  console.log('');

  // Buscar usuarios con role = USER que tengan vtuberProfile
  const usersWithProfile = await prisma.user.findMany({
    where: {
      role: 'USER',
      vtuberProfile: { isNot: null },
    },
    select: {
      id: true,
      username: true,
      email: true,
      provider: true,
      createdAt: true,
      vtuberProfile: {
        select: {
          id: true,
          displayName: true,
          isVerified: true,
          isApproved: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (usersWithProfile.length === 0) {
    console.log('✅ No se encontraron usuarios role USER con VTuberProfile.');
    console.log('');
    await prisma.$disconnect();
    return;
  }

  console.log(`📊 Se encontraron ${usersWithProfile.length} usuario(s):`);
  console.log('');

  // Tabla resumen
  const header = '  #  │ Usuario              │ Provider  │ Creado         │ VTuberProfile';
  const sep    = '─────┼──────────────────────┼───────────┼────────────────┼──────────────────────────────';
  console.log(header);
  console.log(sep);

  let discordCount = 0;
  let googleCount = 0;
  let otherCount = 0;

  usersWithProfile.forEach((u, i) => {
    const provider = u.provider.padEnd(9);
    const created = u.createdAt.toISOString().split('T')[0];
    const profileName = u.vtuberProfile?.displayName ?? '(sin nombre)';
    const profileInfo = `"${profileName}" (aprobado: ${u.vtuberProfile?.isApproved})`;

    console.log(
      `  ${String(i + 1).padEnd(2)} │ ${u.username.padEnd(20)} │ ${provider} │ ${created} │ ${profileInfo}`
    );

    if (u.provider === 'DISCORD') discordCount++;
    else if (u.provider === 'GOOGLE') googleCount++;
    else otherCount++;
  });

  console.log('');
  console.log('── Resumen ──────────────────────────────────────────');
  console.log(`  Discord: ${discordCount}`);
  console.log(`  Google:  ${googleCount}`);
  console.log(`  Otros:   ${otherCount}`);
  console.log(`  Total:   ${usersWithProfile.length}`);
  console.log('');

  if (isDryRun) {
    console.log('⚠️  Modo DRY-RUN — no se realizaron cambios.');
    console.log(`   Para ejecutar la limpieza real, omite --dry-run.`);
    console.log('');
    await prisma.$disconnect();
    return;
  }

  // ── Ejecutar limpieza ──────────────────────────────────────────
  console.log('🗑️  Eliminando VTuberProfiles...');

  const profileIds = usersWithProfile
    .map(u => u.vtuberProfile?.id)
    .filter((id): id is string => !!id);

  if (profileIds.length === 0) {
    console.log('❌ No hay perfiles que eliminar (IDs vacíos).');
    await prisma.$disconnect();
    return;
  }

  const result = await prisma.vTuberProfile.deleteMany({
    where: { id: { in: profileIds } },
  });

  console.log(`✅ ${result.count} VTuberProfile(s) eliminado(s).`);
  console.log('');

  // También limpiar cache de sessionStorage de esos usuarios
  // (No podemos tocarla desde el backend, pero la próxima vez que
  //  inicien sesión, el AuthContext ya no tendrá vtuberProfile.)
  console.log('💡 Nota: Los usuarios afectados deberán recargar la página');
  console.log('   para que el frontend refleje los cambios (el cache de');
  console.log('   sessionStorage se actualizará automáticamente al iniciar');
  console.log('   sesión de nuevo).');
  console.log('');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
