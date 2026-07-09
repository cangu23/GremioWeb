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

# ===== BACKEND PRODUCTION STAGE =====
FROM --platform=linux/amd64 node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install wget for health checks and openssl for Prisma
RUN apk add --no-cache wget openssl

# Copy only what the backend needs to run
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/

# Expose port for the Express API
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

# Start the backend API server (migrate DB first, then start)
CMD ["sh", "-c", "npx prisma db push --schema backend/prisma/schema.prisma --skip-generate && node backend/dist/server.js"]
