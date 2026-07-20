"""
Shared fixtures for Media Engine tests.
Generates test images in various formats for detector and image tests.
"""

import io
from typing import Callable

from PIL import Image, ImageDraw
import pytest


# ─── Static Image Fixtures ──────────────────────────────


@pytest.fixture
def rgb_image_bytes() -> bytes:
    """200×150 RGB JPEG image bytes."""
    img = Image.new("RGB", (200, 150), color="darkblue")
    draw = ImageDraw.Draw(img)
    draw.rectangle([10, 10, 190, 140], fill="steelblue")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


@pytest.fixture
def rgba_image_bytes() -> bytes:
    """100×100 RGBA PNG image bytes (with transparency)."""
    img = Image.new("RGBA", (100, 100), (255, 0, 0, 0))  # fully transparent red
    draw = ImageDraw.Draw(img)
    draw.ellipse([10, 10, 90, 90], fill=(0, 255, 0, 255))  # solid green circle
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture
def webp_image_bytes() -> bytes:
    """50×50 solid-color static WebP image bytes."""
    img = Image.new("RGB", (50, 50), color="coral")
    buf = io.BytesIO()
    img.save(buf, format="WEBP", quality=80)
    return buf.getvalue()


@pytest.fixture
def large_image_bytes() -> bytes:
    """2000×1500 RGB JPEG (large image for resize testing)."""
    img = Image.new("RGB", (2000, 1500), color="darkgreen")
    draw = ImageDraw.Draw(img)
    for x in range(0, 2000, 100):
        draw.line([(x, 0), (x, 1500)], fill="lime", width=3)
    for y in range(0, 1500, 100):
        draw.line([(0, y), (2000, y)], fill="lime", width=3)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=95)
    return buf.getvalue()


@pytest.fixture
def tiny_image_bytes() -> bytes:
    """1×1 pixel PNG (edge case for smallest possible image)."""
    img = Image.new("RGBA", (1, 1), color=(255, 255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture
def palette_image_bytes() -> bytes:
    """50×50 indexed-color PNG (P mode, common in simple graphics)."""
    img = Image.new("P", (50, 50))
    img.putpalette([255, 0, 0, 0, 255, 0, 0, 0, 255])
    img.putpixel((0, 0), 0)
    img.putpixel((25, 25), 1)
    img.putpixel((49, 49), 2)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture
def cmyk_image_bytes() -> bytes:
    """50×50 CMYK JPEG (rare format for web, tests conversion)."""
    img = Image.new("CMYK", (50, 50), (0, 255, 0, 0))  # Magenta in CMYK
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


# ─── Animated GIF Fixtures ──────────────────────────────


@pytest.fixture
def animated_gif_bytes() -> bytes:
    """Animated GIF with 6 frames, 200×200px, 300ms each."""
    frames: list[Image.Image] = []
    colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255),
              (255, 255, 0), (255, 0, 255), (0, 255, 255)]
    for color in colors:
        frame = Image.new("RGBA", (200, 200), (0, 0, 0, 0))
        draw = ImageDraw.Draw(frame)
        draw.ellipse([20, 20, 180, 180], fill=color, outline="white")
        draw.text((60, 85), "TEST", fill="white")
        frames.append(frame)

    buf = io.BytesIO()
    frames[0].save(
        buf,
        format="GIF",
        save_all=True,
        append_images=frames[1:],
        duration=300,
        loop=0,
        disposal=2,
    )
    return buf.getvalue()


@pytest.fixture
def single_frame_gif_bytes() -> bytes:
    """Static single-frame GIF (should NOT be detected as animated)."""
    img = Image.new("RGB", (50, 50), color="purple")
    buf = io.BytesIO()
    img.save(buf, format="GIF")
    return buf.getvalue()


@pytest.fixture
def animated_gif_fast_bytes() -> bytes:
    """Animated GIF with fast frames (50ms each — tests duration heuristic)."""
    frames: list[Image.Image] = []
    for color in [(255, 0, 0), (0, 255, 0)]:
        frame = Image.new("RGB", (100, 100), color)
        frames.append(frame)

    buf = io.BytesIO()
    frames[0].save(
        buf,
        format="GIF",
        save_all=True,
        append_images=frames[1:],
        duration=5,  # 5cs = 50ms in GIF spec, but Pillow might store as ms
        loop=0,
        disposal=2,
    )
    return buf.getvalue()


# ─── Animated WebP Fixtures ─────────────────────────────


@pytest.fixture
def animated_webp_bytes() -> bytes:
    """Animated WebP with 4 frames, 150×150px."""
    frames: list[Image.Image] = []
    for i, color in enumerate([(100, 200, 255), (200, 100, 255),
                                (255, 200, 100), (100, 255, 200)]):
        frame = Image.new("RGBA", (150, 150), (*color, 255))
        draw = ImageDraw.Draw(frame)
        draw.ellipse([25, 25, 125, 125], fill=(*color, 200), outline="white")
        frames.append(frame)

    buf = io.BytesIO()
    frames[0].save(
        buf,
        format="WEBP",
        save_all=True,
        append_images=frames[1:],
        duration=200,
        loop=0,
        quality=80,
    )
    return buf.getvalue()


# ─── Error / Edge Case Fixtures ─────────────────────────


@pytest.fixture
def empty_bytes() -> bytes:
    """Empty bytes (edge case)."""
    return b""


@pytest.fixture
def corrupted_bytes() -> bytes:
    """Corrupted/non-image bytes."""
    return b"this is not an image file\x00\x01\x02"


@pytest.fixture
def image_generator() -> Callable:
    """Factory fixture: returns a function that creates images on the fly."""
    def _make_image(width: int, height: int, fmt: str = "PNG",
                    color: tuple = (100, 100, 200)) -> bytes:
        img = Image.new("RGB", (width, height), color=color)
        buf = io.BytesIO()
        save_kwargs: dict = {"format": fmt}
        if fmt.upper() in ("JPEG", "JPG"):
            save_kwargs["quality"] = 85
        elif fmt.upper() == "WEBP":
            save_kwargs["quality"] = 80
        img.save(buf, **save_kwargs)
        return buf.getvalue()
    return _make_image
