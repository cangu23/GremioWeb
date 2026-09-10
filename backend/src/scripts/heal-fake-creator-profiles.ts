/**
 * heal-fake-creator-profiles.ts
 * ──────────────────────────────────────────────────────────
 * Migración one-off: restablece la consistencia entre User.role y los
 * perfiles de creador (VTuberProfile / StreamerProfile) en AMBAS
 * direcciones. Los badges "+ VTUBER" / "+ STREAMER" salen de perfiles
 * aprobados o del rol en User.role; si solo existe una de las dos cosas,
 * el badge es falso.
 *
 * Dirección 1 — Perfil sin rol real:
 *   VTuberProfile/StreamerProfile (aprobado o verificado) cuyo usuario NO
 *   tiene el rol correspondiente → isApproved=false, isVerified=false,
 *   isHidden=true. Sin esto quedaba el check azul activo aunque se
 *   desaprobaba el perfil (isVerifiedEffective lee profile.isVerified).
 *
 * Dirección 2 — Rol sin perfil aprobado:
 *   'VTUBER'/'STREAMER' en User.role sin perfil aprobado que lo respalde
 *   → se quita el rol del string (p. ej. "USER,VTUBER" → "USER"; vacío
 *   → "USER"). Si displayedRole apuntaba al rol removido, se limpia.
 *   Si además existía un perfil huérfano, ya quedó normalizado en la
 *   dirección 1.
 *
 * Excepciones: usernames en KEEP no se tocan en ninguna dirección
 * (creadores legítimos cuyo rol pudo perderse — p. ej. los legacy de
 * heal-legacy-vtubers.ts). Nada se borra: todo es reversible a mano.
 *
 * Uso (desde backend/):
 *   npx ts-node src/scripts/heal-fake-creator-profiles.ts --dry-run
 *   npx ts-node src/scripts/heal-fake-creator-profiles.ts
 * ──────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { parseUserRoles } from '@gremio-estelar/shared';

const prisma = new PrismaClient();

// Usernames exemptos de la limpieza en AMBAS direcciones.
const KEEP: string[] = ['canguvt', 'aleshaW', 'yusuki_yukihira', 'hoshi'];

/** Quita un rol del string User.role; si queda vacío devuelve 'USER'. */
function removeRole(roleStr: string, target: string): { next: string; removed: boolean } {
  const parts = (roleStr || '')
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);
  const kept = parts.filter((r) => r.toUpperCase() !== target);
  return { next: kept.length > 0 ? kept.join(',') : 'USER', removed: kept.length !== parts.length };
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log('');
  console.log('🩹 Sanación de creadores falsos (perfiles + roles, ambas direcciones)');
  console.log('══════════════════════════════════════════════════════════════════');
  console.log(`Modo: ${isDryRun ? 'DRY-RUN (sin cambios)' : 'APLICAR CAMBIOS'}`);
  console.log('');

  let profilesFixed = 0;
  let rolesFixed = 0;
  let keptCount = 0;

  // Users cuya inconsistencia ya fue detectada en la dirección 1
  // (necesario para que el dry-run reporte exactamente lo que aplicaría).
  const cleanedProfileUserIds = { vtuber: new Set<string>(), streamer: new Set<string>() };

  // ── Dirección 1: perfil (aprobado o verificado) sin rol real ──
  const profileChecks: Array<{
    model: 'vTuberProfile' | 'streamerProfile';
    role: string;
    label: string;
    cleaned: Set<string>;
  }> = [
    { model: 'vTuberProfile', role: 'VTUBER', label: 'VTuberProfiles', cleaned: cleanedProfileUserIds.vtuber },
    { model: 'streamerProfile', role: 'STREAMER', label: 'StreamerProfiles', cleaned: cleanedProfileUserIds.streamer },
  ];

  for (const { model, role, label, cleaned } of profileChecks) {
    const profiles = await (prisma as any)[model].findMany({
      select: {
        id: true,
        displayName: true,
        isApproved: true,
        isVerified: true,
        isHidden: true,
        user: { select: { id: true, username: true, role: true } },
      },
    });

    const fakes = profiles.filter(
      (p: any) => !parseUserRoles(p.user.role).includes(role) // sin rol real (God Mode no aplica: es el rol literal)
    );

    if (fakes.length === 0) {
      console.log(`✅ ${label}: sin perfiles falsos`);
      continue;
    }

    console.log(`❌ ${label}: ${fakes.length} perfil(es) sin rol ${role} en el usuario:`);
    for (const p of fakes) {
      if (KEEP.includes(p.user.username)) {
        keptCount++;
        console.log(`   ⏭️  "${p.displayName}" (@${p.user.username}) — exento (KEEP)`);
        continue;
      }
      const needsFix = p.isApproved || p.isVerified || !p.isHidden;
      if (!needsFix) continue;
      console.log(`   - "${p.displayName}" (@${p.user.username}) → roles reales: "${p.user.role}" → desaprobar, desverificar y ocultar`);
      profilesFixed++;
      cleaned.add(p.user.id);
      if (!isDryRun) {
        await (prisma as any)[model].update({
          where: { id: p.id },
          data: { isApproved: false, isVerified: false, isHidden: true },
        });
      }
    }
  }

  // ── Dirección 2: rol sin perfil aprobado que lo respalde ──
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      displayedRole: true,
      vtuberProfile: { select: { isApproved: true } },
      streamerProfile: { select: { isApproved: true } },
    },
  });

  for (const u of users) {
    if (KEEP.includes(u.username)) continue;

    const roles = parseUserRoles(u.role);
    let nextRole = u.role || 'USER';
    let changed = false;
    const removedRoles: string[] = [];

    // El perfil cuenta como respaldo solo si está aprobado Y no fue marcado
    // como falso en la dirección 1 (así el dry-run coincide con la aplicación).
    const profileBacksRole = (
      role: string,
      profile: { isApproved: boolean } | null,
      cleanedSet: Set<string>
    ) => !!profile?.isApproved && !cleanedSet.has(u.id) && roles.includes(role);

    const cleanFake = (
      role: string,
      profile: { isApproved: boolean } | null,
      cleanedSet: Set<string>
    ) => {
      if (!roles.includes(role)) return;
      if (profileBacksRole(role, profile, cleanedSet)) return;
      const res = removeRole(nextRole, role);
      if (res.removed) {
        nextRole = res.next;
        changed = true;
        removedRoles.push(role);
      }
    };

    cleanFake('VTUBER', u.vtuberProfile, cleanedProfileUserIds.vtuber);
    cleanFake('STREAMER', u.streamerProfile, cleanedProfileUserIds.streamer);

    if (!changed) continue;

    // Si displayedRole apuntaba a un rol removido, limpiarlo también.
    const displayed = (u.displayedRole || '').toUpperCase();
    const nextDisplayed = removedRoles.includes(displayed) ? null : u.displayedRole;

    rolesFixed++;
    console.log(
      `🎭 @${u.username}: rol "${u.role}" → "${nextRole}" (removido: ${removedRoles.join(', ')} — sin perfil aprobado que lo respalde)`
    );

    if (!isDryRun) {
      await prisma.user.update({
        where: { id: u.id },
        data: {
          role: nextRole,
          ...(nextDisplayed !== u.displayedRole ? { displayedRole: nextDisplayed } : {}),
        },
      });
    }
  }

  console.log('');
  if (isDryRun) {
    console.log(`⚠️  DRY-RUN finalizado — ${profilesFixed} perfil(es) y ${rolesFixed} rol(es) a corregir. No se aplicó nada.`);
    console.log('   Revisa la lista; si alguien es legítimo, añádelo a KEEP en el script.');
    console.log('   Ejecuta sin --dry-run para aplicar.');
  } else {
    console.log(`🎉 Listo — ${profilesFixed} perfil(es) normalizado(s), ${rolesFixed} rol(es) removido(s), ${keptCount} exento(s) (KEEP).`);
    console.log('   Nada fue borrado: los cambios son reversibles a mano.');
    console.log('   Recarga la app para ver los badges corregidos.');
  }
  console.log('');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
