#!/bin/sh

# ============================================================
# Gremio Estelar — Production Startup Script
# Architecture:
#   - Express (backend) runs on internal port 4001 (background)
#   - Next.js (frontend) runs on Render's $PORT (foreground)
#   - Next.js rewrites /api/* requests to Express on 4001
# This avoids complex reverse proxies and is the recommended pattern.
# ============================================================

BACKEND_PORT=4001

# ── Database migration ─────────────────────────────────────
if [ -f /app/prisma/schema.prisma ] || [ -f /app/backend/prisma/schema.prisma ]; then
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

# ── Start Express backend on internal port (background) ────
if [ -f /app/backend/dist/server.js ]; then
  echo "[BOOT] Starting Express backend on port $BACKEND_PORT..."
  PORT=$BACKEND_PORT node /app/backend/dist/server.js &
  EXPRESS_PID=$!
  echo "[BOOT] Express started (PID: $EXPRESS_PID)"
  
  # Wait for Express to be ready (cold start can take 10-30s on Render)
  echo "[BOOT] Waiting for Express to be ready..."
  for i in 1 2 3 4 5 6 7 8; do
    if curl -s http://localhost:$BACKEND_PORT/api/health > /dev/null 2>&1; then
      echo "[BOOT] Express ready on port $BACKEND_PORT"
      break
    fi
    echo "[BOOT] Waiting for Express (attempt $i)..."
    sleep 3
  done
else
  echo "[BOOT] Backend build not found — running frontend only"
fi

# ── Start Next.js frontend on Render's PORT (foreground) ───
if [ -f /app/frontend/server.js ]; then
  echo "[BOOT] Starting Next.js frontend on port ${PORT:-4000}..."
  # exec replaces the shell so signals go directly to Next.js
  exec node /app/frontend/server.js
else
  echo "[BOOT] Frontend build not found at /app/frontend/server.js"
  ls -la /app/frontend/ 2>/dev/null || echo "[BOOT] /app/frontend/ does not exist"
  exit 1
fi
