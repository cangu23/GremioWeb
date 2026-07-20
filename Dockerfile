# ===== BUILD STAGE =====
# Build platform: linux/amd64 (required by Render)
FROM --platform=linux/amd64 node:20-alpine AS builder

WORKDIR /app

# Copy root package files first (for layer caching)
COPY package.json package-lock.json tsconfig.json ./

# Copy workspace package files
COPY backend/package.json backend/tsconfig.json backend/
COPY frontend/package.json frontend/tsconfig.json frontend/
COPY frontend/next.config.mjs frontend/
COPY shared/package.json shared/tsconfig.json shared/

# Install OpenSSL (required by Prisma on Alpine)
RUN apk add --no-cache openssl

# Install ALL dependencies but skip postinstall (prisma schema not copied yet)
RUN npm ci --ignore-scripts

# Copy shared source files
COPY shared/*.ts shared/
COPY shared/contracts/ shared/contracts/

# Build shared package first
RUN npm run build:shared

# Copy backend source
COPY backend/src backend/src
COPY backend/prisma backend/prisma

# Generate Prisma client (uses PostgreSQL schema)
RUN npx prisma generate --schema backend/prisma/schema.prisma

# Build backend
RUN npm run build:backend

# Copy frontend source
COPY frontend/src frontend/src
COPY frontend/public frontend/public

# Build frontend (needs NEXT_PUBLIC_API_BASE_URL — pass it as build arg)
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NODE_ENV=production
RUN npm run build --workspace=frontend

# ===== FRONTEND PRODUCTION STAGE =====
FROM --platform=linux/amd64 node:20-alpine AS frontend-runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy standalone output (self-contained Next.js server)
COPY --from=builder /app/frontend/.next/standalone ./

# Copy static files (not included in standalone by default)
COPY --from=builder /app/frontend/.next/static ./.next/static

# Copy public assets
COPY --from=builder /app/frontend/public ./public

EXPOSE 3000

# Start Next.js standalone server
CMD ["node", "server.js"]

# ===== BACKEND PRODUCTION STAGE =====
FROM --platform=linux/amd64 node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install openssl (required by Prisma on Alpine)
RUN apk add --no-cache openssl

# Copy only what the backend needs to run
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

# Copy workspace package.json files BEFORE prune so npm can resolve dependency tree
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/shared/package.json ./shared/

COPY --from=builder /app/node_modules ./node_modules

# Remove devDependencies (vitest, typescript, @types/*, etc.) to reduce image size
# prisma CLI is kept because it's needed for runtime migrations (see /start.sh)
RUN npm prune --omit=dev

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/shared/dist ./shared/dist

# ── Frontend (Next.js standalone) ─────────────────────
# Copy the standalone output and static files so Express can serve them
COPY --from=builder /app/frontend/.next/standalone ./frontend
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/frontend/public ./frontend/public

# Expose port for the Express API
EXPOSE 4000

# Create startup script (avoids JSON escaping issues with multi-line CMD)
RUN printf '#!/bin/sh\n\
# Start Next.js standalone server in background (port 3001)\n\
if [ -f /app/frontend/server.js ]; then\n\
  echo "[BOOT] Starting Next.js frontend on port 3001..."\n\
  PORT=3001 node /app/frontend/server.js &\n\
  FRONTEND_PID=$!\
\
  # Wait for frontend to be ready (max 15s)\n\
  for i in 1 2 3; do\n\
    if curl -s http://localhost:3001/ > /dev/null 2>&1; then\n\
      echo "[BOOT] Frontend ready (PID: $FRONTEND_PID)"\n\
      break\n\
    fi\n\
    echo "[BOOT] Waiting for frontend to start (attempt $i)..."\n\
    sleep 5\n\
  done\n\
fi\n\
# Database migration (retry up to 5 times)\n\
for i in 1 2 3 4 5; do\n\
  echo "[BOOT] Attempt $i: Running prisma db push..."\n\
  if npx prisma db push --schema backend/prisma/schema.prisma --skip-generate; then\n\
    echo "[BOOT] Database sync successful!"\n\
    break\n\
  fi\n\
  if [ "$i" -lt 5 ]; then\n\
    echo "[BOOT] Attempt $i failed, waiting 5s before retry..."\n\
    sleep 5\n\
  fi\n\
done\n\
echo "[BOOT] Starting backend server on port 4000..."\n\
exec node backend/dist/server.js\n' > /start.sh && chmod +x /start.sh

CMD ["/start.sh"]
