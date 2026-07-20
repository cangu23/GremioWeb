#!/bin/sh

# ============================================================
# Gremio Estelar — Production Startup Script
# Starts both the Next.js frontend and Express backend
# ============================================================

# ── Start Next.js frontend (standalone) in background ──────
if [ -f /app/frontend/server.js ]; then
  echo "[BOOT] Starting Next.js frontend on port 3001..."
  PORT=3001 node /app/frontend/server.js &
  FRONTEND_PID=$!

  # Wait for frontend to be ready (max 15 seconds)
  for i in 1 2 3; do
    if curl -s http://localhost:3001/ > /dev/null 2>&1; then
      echo "[BOOT] Frontend ready (PID: $FRONTEND_PID)"
      break
    fi
    echo "[BOOT] Waiting for frontend to start (attempt $i)..."
    sleep 5
  done
else
  echo "[BOOT] Frontend build not found — running backend only"
fi

# ── Database migration ─────────────────────────────────────
db_synced=false
for i in 1 2 3 4 5; do
  echo "[BOOT] Attempt $i: Running prisma db push..."
  if npx prisma db push --schema backend/prisma/schema.prisma --skip-generate; then
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

# ── Start Express backend (foreground) ─────────────────────
echo "[BOOT] Starting backend server on port 4000..."
exec node backend/dist/server.js
