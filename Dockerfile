# ===== BUILD STAGE =====
# Build platform: linux/amd64 (required by Render)
FROM --platform=linux/amd64 node:20-alpine AS builder

WORKDIR /app

# ── Layer 1: Install system deps ───────────────────────────
# OpenSSL is required by Prisma on Alpine
RUN apk add --no-cache openssl

# ── Layer 2: Install Node dependencies ─────────────────────
# Copy only package files first for Docker layer caching.
# This layer only rebuilds when package.json / lockfile changes.
COPY package.json package-lock.json tsconfig.json ./
COPY backend/package.json backend/tsconfig.json backend/
COPY frontend/package.json frontend/tsconfig.json frontend/
COPY frontend/next.config.mjs frontend/
COPY shared/package.json shared/tsconfig.json shared/

# Disable npm update notifier (noise during build)
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

# Install ALL dependencies (including devDeps needed for tsc build).
# --ignore-scripts skips postinstall hook (prisma generate needs schema file)
RUN npm ci --ignore-scripts

# ── Layer 3: Build shared package ──────────────────────────
COPY shared/*.ts shared/
COPY shared/contracts/ shared/contracts/

RUN npm run build:shared

# ── Layer 4: Generate Prisma client ────────────────────────
# Copy prisma schema BEFORE backend source so that schema changes
# are the only thing that invalidates this cache layer.
COPY backend/prisma backend/prisma

RUN npx prisma generate --schema backend/prisma/schema.prisma

# ── Layer 5: Build backend (Express) ───────────────────────
# Source changes invalidate this layer, but not the prisma layer above.
COPY backend/src backend/src

ENV NODE_ENV=production
RUN npm run build:backend

# ── Layer 6: Build frontend (Next.js) ──────────────────────
COPY frontend/src frontend/src
COPY frontend/public frontend/public

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build --workspace=frontend

# ── Layer 7: Prune devDependencies for smaller final image ──
# Reduce node_modules size in the builder before copying to runner.
# This avoids running prune in the runner stage where it's slower.
RUN npm prune --omit=dev

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

# ===== PRODUCTION STAGE (Next.js foreground + Express background) =====
# Architecture:
#   - Next.js standalone runs on Render's $PORT (foreground, handles HTTP)
#   - Express backend runs on internal port 4001 (background)
#   - Next.js rewrites /api/* -> Express via next.config.mjs
FROM --platform=linux/amd64 node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install openssl (required by Prisma on Alpine) + curl (for healthchecks)
RUN apk add --no-cache openssl curl

# ── Copy production dependencies (already pruned in builder) ──
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/shared/package.json ./shared/

# node_modules is already pruned in builder stage (Layer 7)
# No need to run npm prune again here
COPY --from=builder /app/node_modules ./node_modules

# ── Backend (Express) ────────────────────────────────
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/shared/dist ./shared/dist

# ── Frontend (Next.js standalone) ─────────────────────
# The standalone folder contains a self-contained server.js with bundled deps
COPY --from=builder /app/frontend/.next/standalone ./frontend

# Static files are not included in standalone by default
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static

# Public assets (favicon, robots.txt, etc.)
COPY --from=builder /app/frontend/public ./frontend/public

# Frontend listens on Render's $PORT, backend on internal 4001
EXPOSE 4000

# Copy startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
