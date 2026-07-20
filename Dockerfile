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

# Copy root package files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

# Copy workspace package.json files BEFORE prune so npm can resolve dependency tree
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/shared/package.json ./shared/

COPY --from=builder /app/node_modules ./node_modules

# Remove devDependencies to reduce image size
# prisma CLI is kept for runtime migrations (see /start.sh)
RUN npm prune --omit=dev

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
