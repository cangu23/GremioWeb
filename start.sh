#!/bin/sh

# ============================================================
# Gremio Estelar — Production Startup Script
# ============================================================
# Architecture:
#   With frontend: Express on internal 4001, Next.js on Render's $PORT
#   Without frontend: Express on Render's $PORT directly (API mode)
# ============================================================

BACKEND_PORT=4001
RENDER_PORT="${PORT:-4000}"

# ── Database migration ─────────────────────────────────────
# Prefer `prisma migrate deploy` (versioned, non-destructive migrations).
#
# The production DB was historically managed with `prisma db push` (no
# migration history). On those legacy DBs `migrate deploy` fails because the
# baseline migrations describe tables that already exist. In that case we
# BASELINE them (mark as already applied WITHOUT executing them) and retry, so
# `migrate deploy` applies only the real new deltas (e.g.
# 20260806_add_daily_claim_date, which backfills + dedupes data before
# creating its unique index). `migrate resolve --applied` is idempotent, so
# it is harmless on databases that already have a migration history.
#
# Last resort: `prisma db push --accept-data-loss` to force-sync a drifted
# schema. Only reached when the versioned path cannot proceed.
if [ -f /app/backend/prisma/schema.prisma ]; then
  SCHEMA="/app/backend/prisma/schema.prisma"
  db_synced=false
  for i in 1 2 3 4 5; do
    echo "[BOOT] Attempt $i: Running prisma migrate deploy..."
    if npx prisma migrate deploy --schema "$SCHEMA"; then
      echo "[BOOT] Database migrations applied successfully!"
      db_synced=true
      break
    fi

    echo "[BOOT] migrate deploy failed — baselining legacy (db-push era) migrations and retrying..."
    npx prisma migrate resolve --applied 20260720_add_stickers_table --schema "$SCHEMA" >/dev/null 2>&1 || true
    npx prisma migrate resolve --applied 20260803_add_profile_frame --schema "$SCHEMA" >/dev/null 2>&1 || true

    if npx prisma migrate deploy --schema "$SCHEMA"; then
      echo "[BOOT] Migrations applied after baselining legacy migrations!"
      db_synced=true
      break
    fi

    echo "[BOOT] migrate deploy failed — trying prisma db push fallback..."
    if npx prisma db push --schema "$SCHEMA" --skip-generate --accept-data-loss; then
      echo "[BOOT] Database sync via db push successful!"
      db_synced=true
      break
    fi

    if [ "$i" -lt 5 ]; then
      echo "[BOOT] Attempt $i failed, waiting 5s before retry..."
      sleep 5
    fi
  done
  if [ "$db_synced" != "true" ]; then
    if [ "${NODE_ENV:-}" = "production" ]; then
      echo "[BOOT] ❌ Database sync failed after 5 attempts — refusing to start in production"
      echo "[BOOT]    Check DATABASE_URL and that the database is reachable, then restart."
      exit 1
    fi
    echo "[BOOT] ⚠️  Database sync failed after 5 attempts — starting anyway (dev mode)"
  fi
fi

# ── Modo API-only ─────────────────────────────────────────────
# Con RUN_BACKEND_ONLY=1 se fuerza Express en el puerto público aunque la
# imagen contenga el frontend. Es la configuración RECOMENDADA cuando el
# frontend se despliega como servicio separado (p.ej. Next.js standalone en
# otro host de Render): Socket.IO escucha en el puerto público y el cliente
# conecta directo — los rewrites de Next.js NO proxean WebSocket upgrades, así
# que el monolito siempre deja el chat "desconectado".
if [ "$RUN_BACKEND_ONLY" = "1" ] || [ "$RUN_BACKEND_ONLY" = "true" ]; then
  echo "[BOOT] RUN_BACKEND_ONLY=1 — API-only mode (Express + Socket.IO on public port $RENDER_PORT)"
  exec node /app/backend/dist/server.js
fi

# ── Check if frontend (Next.js standalone) is available ────
if [ -f /app/frontend/server.js ]; then
  echo "[BOOT] Frontend found — starting full stack"
  echo "[BOOT]   Express on internal port $BACKEND_PORT"
  echo "[BOOT]   Next.js on Render port $RENDER_PORT"

  # Start Express on internal port 4001 (background)
  PORT=$BACKEND_PORT node /app/backend/dist/server.js &
  EXPRESS_PID=$!

  # Wait for Express to be ready
  for i in 1 2 3 4 5 6 7 8; do
    if curl -s http://localhost:$BACKEND_PORT/api/health > /dev/null 2>&1; then
      echo "[BOOT] Express ready (PID: $EXPRESS_PID)"
      break
    fi
    sleep 3
  done

  # ⚠️  CRITICAL: force HOSTNAME=0.0.0.0 before starting the Next.js standalone
  # server. Render/Docker set HOSTNAME to the instance hostname, and the
  # standalone server does `server.listen(port, process.env.HOSTNAME || '0.0.0.0')`.
  # If HOSTNAME doesn't resolve to a routable interface (or resolves to the
  # container's ephemeral private IP), the bind happens on the wrong interface
  # and Render returns HTTP 502 to every external request. Same fix as
  # frontend/scripts/start-standalone.mjs.
  export HOSTNAME=0.0.0.0

  # Start Next.js on Render's PORT (foreground)
  echo "[BOOT] Starting Next.js frontend..."
  exec node /app/frontend/server.js
fi

# ── No frontend available — run Express on Render's PORT ───
echo "[BOOT] ⚠️  Frontend build not found — API-only mode"
ls -la /app/frontend/ 2>/dev/null || echo "[BOOT] /app/frontend/ does not exist"

if [ -f /app/backend/dist/server.js ]; then
  echo "[BOOT] Starting Express on Render port $RENDER_PORT..."
  exec node /app/backend/dist/server.js
else
  echo "[BOOT] No backend either — container has nothing to serve"
  exit 1
fi
