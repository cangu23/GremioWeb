import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import optimize as optimize_router
from app.services.storage import is_configured as r2_configured

# ── Logging ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="[MEDIA-ENGINE] %(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("media-engine")

# ── FastAPI App ──────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS — allow the Express backend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Internal service, safe to allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────
app.include_router(optimize_router.router)


# ── Health Check ─────────────────────────────────────────
@app.get("/health", tags=["system"])
async def health():
    """Health check endpoint used by Docker healthcheck and Express."""
    return {
        "status": "ok",
        "service": "gremio-estelar-media-engine",
        "version": "1.0.0",
        "r2_configured": r2_configured(),
    }


@app.get("/", tags=["system"])
async def root():
    return {
        "service": "Gremio Estelar — Media Engine",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "optimize": "/internal/optimize",
        },
    }


# ── Startup ──────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    logger.info("=" * 50)
    logger.info(f"  {settings.APP_NAME}")
    logger.info(f"  Port: {settings.PORT}")
    logger.info(f"  R2 Configured: {r2_configured()}")
    if r2_configured():
        logger.info(f"  R2 Bucket: {settings.R2_BUCKET}")
        logger.info(f"  R2 Public URL: {settings.R2_PUBLIC_URL}")
    else:
        logger.warning("  ⚠️  R2 not configured — uploads will fail!")
    logger.info("=" * 50)


# ── Entry point ──────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", str(settings.PORT)))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=settings.DEBUG,
        log_level="info",
    )
