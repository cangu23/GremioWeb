# ===== MEDIA ENGINE — Python/FastAPI microservice =====
# ======================================================
# Build platform: linux/amd64 (required by Render)
# ======================================================

# ── BUILD STAGE ────────────────────────────────────────
FROM --platform=linux/amd64 python:3.12-slim AS builder

WORKDIR /app

# Python optimization: don't write .pyc files, unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Layer 1: Install build dependencies (Pillow needs native libs)
# These change rarely — cached across builds
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libjpeg-dev \
    libwebp-dev \
    && rm -rf /var/lib/apt/lists/*

# Layer 2: Install Python dependencies
# Only rebuilds when requirements.txt changes
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ── RUNTIME STAGE ─────────────────────────────────────
FROM --platform=linux/amd64 python:3.12-slim AS runner

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Layer 1: Install runtime libs only (for Pillow to work)
# These change rarely
RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg62-turbo \
    libwebp7 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Layer 2: Copy installed Python packages from builder
COPY --from=builder /root/.local /root/.local

# Layer 3: Copy application code last (changes most often)
COPY app ./app

# Make scripts in .local usable
ENV PATH=/root/.local/bin:$PATH

# Render injects the PORT env var dynamically
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import os,urllib.request; port=os.getenv('PORT','8001'); urllib.request.urlopen(f'http://localhost:{port}/health')" || exit 1

# Use exec form for proper signal handling, shell substitution for $PORT
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8001}
