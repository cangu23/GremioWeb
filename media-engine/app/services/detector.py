import io
from PIL import Image


def is_animated(file_bytes: bytes) -> bool:
    """Detect if a byte buffer contains an animated image (GIF/WebP)."""
    try:
        img = Image.open(io.BytesIO(file_bytes))
        return getattr(img, "is_animated", False)
    except Exception:
        return False


def get_frame_count(file_bytes: bytes) -> int:
    """Return the number of frames in an animated image."""
    try:
        img = Image.open(io.BytesIO(file_bytes))
        if hasattr(img, "n_frames"):
            return img.n_frames
        return 1
    except Exception:
        return 1


def get_image_info(file_bytes: bytes) -> dict:
    """Extract metadata from an image buffer."""
    try:
        img = Image.open(io.BytesIO(file_bytes))
        return {
            "width": img.width,
            "height": img.height,
            "format": img.format or "UNKNOWN",
            "mode": img.mode,
            "animated": getattr(img, "is_animated", False),
            "frames": getattr(img, "n_frames", 1) if getattr(img, "is_animated", False) else 1,
        }
    except Exception as e:
        return {"error": str(e)}
