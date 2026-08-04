// ============================================================================
// Gremio Estelar — Next.js standalone server launcher
// ----------------------------------------------------------------------------
// `next start` no funciona con `output: standalone` (warning en producción).
// Este script localiza el server.js generado por `next build` (puede estar en
// una subcarpeta según la estructura del monorepo), copia los assets estáticos
// (.next/static y public) dentro del standalone y lo ejecuta.
//
// Uso: `npm run start` (frontend) — Render/CasaOS/Cloudflare Tunnel compatible.
// ============================================================================

import { existsSync, cpSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const standaloneRoot = join(projectRoot, '.next', 'standalone');

/** Find server.js inside the standalone output, skipping node_modules. */
function findServerJs(dir, depth = 0) {
  if (depth > 4) return null;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules') continue; // avoid matching package server.js
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findServerJs(full, depth + 1);
      if (found) return found;
    } else if (entry.name === 'server.js') {
      return full;
    }
  }
  return null;
}

if (!existsSync(standaloneRoot)) {
  console.error(
    '❌ .next/standalone no existe. Ejecuta "npm run build" (next build) antes de iniciar.'
  );
  process.exit(1);
}

const serverJs = findServerJs(standaloneRoot);
if (!serverJs) {
  console.error('❌ No se encontró server.js dentro de .next/standalone.');
  process.exit(1);
}

const serverDir = dirname(serverJs);

// ── Copiar assets que Next no incluye en el standalone ─────────────────────
const staticSrc = join(projectRoot, '.next', 'static');
const staticDest = join(serverDir, '.next', 'static');
if (existsSync(staticSrc) && !existsSync(staticDest)) {
  cpSync(staticSrc, staticDest, { recursive: true });
  console.log(`[START] Assets estáticos copiados → ${staticDest}`);
}

const publicSrc = join(projectRoot, 'public');
const publicDest = join(serverDir, 'public');
if (existsSync(publicSrc) && !existsSync(publicDest)) {
  cpSync(publicSrc, publicDest, { recursive: true });
  console.log(`[START] public copiado → ${publicDest}`);
}

console.log(`[START] Iniciando Next.js standalone: ${serverJs}`);

// ── Env ─────────────────────────────────────────────────────────────────────
// Render/Docker definen HOSTNAME (hostname de la instancia), y el standalone
// server hace `server.listen(port, process.env.HOSTNAME || '0.0.0.0')`.
// Si HOSTNAME no resuelve a una interfaz, el bind falla → crash → HTTP 502.
// Forzamos 0.0.0.0 para que Render/CasaOS puedan enrutar al contenedor.
const childEnv = {
  ...process.env,
  HOSTNAME: '0.0.0.0',
};

const child = spawn(process.execPath, [serverJs], {
  stdio: 'inherit',
  env: childEnv,
});

// Forward termination signals (Render/CasaOS send SIGTERM/SIGINT on stop)
// so the Next.js server can shut down gracefully instead of being orphaned.
for (const signal of ['SIGTERM', 'SIGINT', 'SIGHUP']) {
  process.on(signal, () => {
    console.log(`[START] Recibido ${signal}, cerrando servidor...`);
    child.kill(signal);
  });
}

child.on('exit', (code) => process.exit(code ?? 0));
child.on('error', (err) => {
  console.error('❌ Error al iniciar el servidor standalone:', err);
  process.exit(1);
});
