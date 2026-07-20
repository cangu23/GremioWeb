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
if [ -f /app/backend/prisma/schema.prisma ]; then
  SCHEMA="/app/backend/prisma/schema.prisma"
  db_synced=false
  for i in 1 2 3 4 5; do
    echo "[BOOT] Attempt $i: Running prisma db push..."
    if npx prisma db push --schema "$SCHEMA" --skip-generate; then
      echo "[BOOT] Database sync successful!"
      db_synced=true
      break
    fi
    if [ "$i" -lt 5 ]; then
      echo "[BOOT] Attempt $i failed, waiting 5s before retry..."
      sleep 5
    fi
  done
  if [ "$db_synced" != "true" ]; then
    echo "[BOOT] ⚠️  Database sync failed after 5 attempts — starting anyway"
  fi
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
