# ===== MEDIA ENGINE — Python/FastAPI microservice =====
# ======================================================
# Build platform: linux/amd64 (required by Render)
# ======================================================

# ── BUILD STAGE ────────────────────────────────────────
FROM --platform=linux/amd64 python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies (Pillow needs some native libs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libjpeg-dev \
    libwebp-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ── RUNTIME STAGE ─────────────────────────────────────
# Render expects the service to run on the $PORT env var (dynamic).
# We use a shell-form CMD to substitute $PORT at runtime.
FROM --platform=linux/amd64 python:3.12-slim AS runner

WORKDIR /app

# Install runtime libs only (for Pillow to work)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg62-turbo \
    libwebp7 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local

# Copy application code
COPY app ./app

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Expose port (Render overrides this with $PORT)
EXPOSE 8001

# Health check (uses 8001 as fallback if PORT not set)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import os,urllib.request; port=os.getenv('PORT','8001'); urllib.request.urlopen(f'http://localhost:{port}/health')" || exit 1

# Use shell form so $PORT env var is substituted at runtime
# Render injects the PORT env var automatically
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8001}
