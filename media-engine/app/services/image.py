import io
from PIL import Image

from app.config import settings
from app.services.detector import is_animated, get_frame_count, get_image_info


def compress_static(file_bytes: bytes, max_width: int = 1200, quality: int = 80) -> tuple[bytes, str, int, int]:
    """
    Process a static image:
    1. Resize proportionally to fit within max_width (downscale only)
    2. Convert to WebP with specified quality
    Returns (buffer, format, width, height)
    """
    img = Image.open(io.BytesIO(file_bytes))

    # Convert RGBA/PA to RGB if needed (WebP supports alpha, but cleaner to handle)
    if img.mode in ("P", "PA"):
        img = img.convert("RGBA")
    elif img.mode == "CMYK":
        img = img.convert("RGB")

    # Resize: fit inside max_width square preserving aspect ratio
    original_w, original_h = img.size
    if original_w > max_width or original_h > max_width:
        ratio = min(max_width / original_w, max_width / original_h)
        new_w = int(original_w * ratio)
        new_h = int(original_h * ratio)
        img = img.resize((new_w, new_h), Image.LANCZOS)

    # Save as WebP (lossy compression, alpha channel preserved automatically)
    buf = io.BytesIO()
    save_kwargs: dict = {"format": "WEBP", "quality": quality, "lossless": False}

    img.save(buf, **save_kwargs)
    buf.seek(0)

    return buf.getvalue(), "webp", img.width, img.height


def compress_animated(file_bytes: bytes, max_width: int = 800, quality: int = 70) -> tuple[bytes, str, int, int]:
    """
    Process an animated image (GIF/WebP):
    1. Extract all frames
    2. Resize proportionally
    3. Save as Animated WebP (loop=0)
    Returns (buffer, format, width, height)
    """
    img = Image.open(io.BytesIO(file_bytes))

    # Get original size
    original_w, original_h = img.size
    if original_w > max_width or original_h > max_width:
        ratio = min(max_width / original_w, max_width / original_h)
        new_w = int(original_w * ratio)
        new_h = int(original_h * ratio)
    else:
        new_w, new_h = original_w, original_h

    # Extract and resize all frames
    frames = []
    durations = []
    try:
        while True:
            # Convert to RGBA for consistency
            frame = img.convert("RGBA")
            if new_w != original_w or new_h != original_h:
                frame = frame.resize((new_w, new_h), Image.LANCZOS)
            frames.append(frame)
            # Get frame duration in ms (Pillow stores in centiseconds for GIF)
            try:
                duration = img.info.get("duration", 50)
                # GIF stores duration in centiseconds (cs) → convert to ms
                if img.format == "GIF" and duration < 100:
                    duration = duration * 10
                durations.append(max(duration, 20))  # minimum 20ms
            except Exception:
                durations.append(50)

            img.seek(img.tell() + 1)
    except EOFError:
        pass  # End of frames

    if not frames:
        # Fallback: process as static
        return compress_static(file_bytes, max_width, quality)

    # Save as Animated WebP
    buf = io.BytesIO()
    frames[0].save(
        buf,
        format="WEBP",
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,  # Infinite loop
        quality=quality,
        lossless=False,
    )
    buf.seek(0)

    return buf.getvalue(), "webp", new_w, new_h


def optimize(file_bytes: bytes, max_width: int = 1200, quality: int = 80,
             keep_animation: bool = True) -> dict:
    """
    Main optimization entry point.
    Detects animation and dispatches to the appropriate processor.
    Returns dict with: buffer, format, width, height, animated, original_size, compressed_size
    """
    info = get_image_info(file_bytes)
    original_size = len(file_bytes)

    if info.get("animated") and keep_animation:
        # Process as animated
        anim_quality = settings.WEBP_QUALITY_ANIMATED
        anim_max_width = min(max_width, settings.MAX_GIF_DIMENSION)
        buffer, fmt, w, h = compress_animated(file_bytes, anim_max_width, anim_quality)
        animated = True
    else:
        # Process as static
        buffer, fmt, w, h = compress_static(file_bytes, max_width, quality)
        animated = False

    compressed_size = len(buffer)

    return {
        "buffer": buffer,
        "format": fmt,
        "width": w,
        "height": h,
        "animated": animated,
        "original_size_bytes": original_size,
        "compressed_size_bytes": compressed_size,
        "reduction_pct": round((1 - compressed_size / original_size) * 100, 1) if original_size > 0 else 0,
    }
