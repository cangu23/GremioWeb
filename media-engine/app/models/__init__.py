from pydantic import BaseModel
from typing import Optional


class OptimizeRequest(BaseModel):
    """Request from Express backend to optimize an image."""
    folder: str = "general"  # 'avatars', 'banners', 'posts', 'guild', 'stickers'
    max_width: int = 1200
    quality: int = 80
    keep_animation: bool = True  # Whether to preserve animation for GIFs


class OptimizeResponse(BaseModel):
    """Response sent back to Express after optimization."""
    status: str  # 'ok' | 'error'
    url: Optional[str] = None
    format: Optional[str] = None
    size_bytes: Optional[int] = None
    original_size_bytes: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    animated: bool = False
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "gremio-estelar-media-engine"
    version: str = "1.0.0"
    r2_configured: bool = False
