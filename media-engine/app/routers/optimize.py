import io
import logging
import time
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from app.models import OptimizeResponse
from app.services.detector import get_image_info, is_animated
from app.services.image import optimize as process_image
from app.services.storage import upload, is_configured as r2_configured

logger = logging.getLogger("media-engine")
router = APIRouter()


@router.post("/internal/optimize", response_model=OptimizeResponse)
async def optimize(
    image: UploadFile = File(...),
    folder: str = Form("general"),
    max_width: int = Form(1200),
    quality: int = Form(80),
    keep_animation: bool = Form(True),
):
    """
    Optimize an image and upload it to R2.

    - Detects animation (GIF/WebP animado)
    - Resizes proportionally to fit within max_width
    - Converts to WebP (static or animated)
    - Uploads to Cloudflare R2
    - Returns public URL
    """
    start = time.time()

    # Validate MIME type
    if image.content_type not in (
        "image/jpeg", "image/png", "image/webp", "image/gif",
    ):
        raise HTTPException(status_code=400, detail=f"Unsupported format: {image.content_type}")

    # Read the file
    file_bytes = await image.read()
    original_size = len(file_bytes)

    if original_size == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    # Check file size limit (5MB)
    if original_size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds 5MB limit")

    # Process the image
    try:
        result = process_image(
            file_bytes,
            max_width=max_width,
            quality=quality,
            keep_animation=keep_animation,
        )
    except Exception as e:
        logger.error(f"Image processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

    # Upload to R2
    buffer = result["buffer"]
    animated = result["animated"]
    fmt = result["format"]

    content_type = "image/webp"

    try:
        storage_result = upload(buffer, folder, content_type)
    except RuntimeError as e:
        logger.warning(f"R2 upload failed (fallback considered): {e}")
        raise HTTPException(status_code=502, detail=f"Storage error: {str(e)}")
    except Exception as e:
        logger.error(f"R2 upload error: {e}")
        raise HTTPException(status_code=502, detail=f"Storage error: {str(e)}")

    elapsed = round((time.time() - start) * 1000, 1)

    logger.info(
        f"[Optimize] {image.filename or 'unknown'}: "
        f"{original_size / 1024:.1f}KB → {len(buffer) / 1024:.1f}KB "
        f"({result['reduction_pct']}% reduction) "
        f"| {'animated' if animated else 'static'} {fmt} "
        f"| {elapsed}ms"
    )

    return OptimizeResponse(
        status="ok",
        url=storage_result,
        format=fmt,
        size_bytes=len(buffer),
        original_size_bytes=original_size,
        width=result["width"],
        height=result["height"],
        animated=animated,
    )


@router.get("/internal/optimize/health")
async def optimize_health():
    """Health check with R2 status."""
    return {
        "status": "ok",
        "r2_configured": r2_configured(),
    }
