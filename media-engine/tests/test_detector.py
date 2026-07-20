"""
Unit tests for media-engine/app/services/detector.py

Tests the three public functions:
- is_animated()
- get_frame_count()
- get_image_info()
"""

import io
from PIL import Image
import pytest
from app.services.detector import is_animated, get_frame_count, get_image_info


# ===========================================================================
# is_animated()
# ===========================================================================


class TestIsAnimated:
    def test_static_jpg_is_not_animated(self, rgb_image_bytes):
        """JPEG images are never animated."""
        assert is_animated(rgb_image_bytes) is False

    def test_static_png_is_not_animated(self, rgba_image_bytes):
        """PNG images are never animated (even with alpha)."""
        assert is_animated(rgba_image_bytes) is False

    def test_static_webp_is_not_animated(self, webp_image_bytes):
        """Static WebP is not animated."""
        assert is_animated(webp_image_bytes) is False

    def test_static_single_frame_gif_is_not_animated(self, single_frame_gif_bytes):
        """A GIF with only 1 frame is NOT animated."""
        assert is_animated(single_frame_gif_bytes) is False

    def test_animated_gif_is_detected(self, animated_gif_bytes):
        """Multi-frame GIF IS animated."""
        assert is_animated(animated_gif_bytes) is True

    def test_animated_webp_is_detected(self, animated_webp_bytes):
        """Multi-frame WebP IS animated."""
        assert is_animated(animated_webp_bytes) is True

    def test_animated_gif_fast_frames(self, animated_gif_fast_bytes):
        """Fast GIF (short duration) is still detected as animated."""
        assert is_animated(animated_gif_fast_bytes) is True

    def test_empty_bytes_returns_false(self, empty_bytes):
        """Empty input gracefully returns False."""
        assert is_animated(empty_bytes) is False

    def test_corrupted_bytes_returns_false(self, corrupted_bytes):
        """Corrupted/non-image input gracefully returns False."""
        assert is_animated(corrupted_bytes) is False

    def test_tiny_image_is_not_animated(self, tiny_image_bytes):
        """1×1 pixel image is not animated."""
        assert is_animated(tiny_image_bytes) is False


# ===========================================================================
# get_frame_count()
# ===========================================================================


class TestGetFrameCount:
    def test_static_jpg_returns_1(self, rgb_image_bytes):
        """Static images always return 1 frame."""
        assert get_frame_count(rgb_image_bytes) == 1

    def test_static_png_returns_1(self, rgba_image_bytes):
        """PNG returns 1 frame."""
        assert get_frame_count(rgba_image_bytes) == 1

    def test_animated_gif_returns_correct_count(self, animated_gif_bytes):
        """Frame count matches the actual number of frames in the fixture."""
        # Read expected count from Pillow directly (independent of function under test)
        img = Image.open(io.BytesIO(animated_gif_bytes))
        expected = img.n_frames
        count = get_frame_count(animated_gif_bytes)
        assert count == expected, f"Expected {expected} frames, got {count}"
        assert count >= 2, "Animated GIF should have at least 2 frames"

    def test_animated_webp_returns_correct_count(self, animated_webp_bytes):
        """Animated WebP should return at least 2 frames."""
        count = get_frame_count(animated_webp_bytes)
        assert count >= 2, f"Expected >=2 frames for animated WebP, got {count}"

    def test_single_frame_gif_returns_1(self, single_frame_gif_bytes):
        """Single-frame GIF returns 1."""
        assert get_frame_count(single_frame_gif_bytes) == 1

    def test_empty_bytes_returns_1(self, empty_bytes):
        """Empty input gracefully returns 1."""
        assert get_frame_count(empty_bytes) == 1

    def test_corrupted_bytes_returns_1(self, corrupted_bytes):
        """Corrupted input gracefully returns 1."""
        assert get_frame_count(corrupted_bytes) == 1


# ===========================================================================
# get_image_info()
# ===========================================================================


class TestGetImageInfo:
    def test_returns_correct_dimensions(self, rgb_image_bytes):
        """Returns correct width and height for a known image."""
        info = get_image_info(rgb_image_bytes)
        assert info["width"] == 200
        assert info["height"] == 150

    def test_identifies_jpeg_format(self, rgb_image_bytes):
        """Correctly identifies JPEG format."""
        info = get_image_info(rgb_image_bytes)
        assert info["format"] == "JPEG"

    def test_identifies_png_format(self, rgba_image_bytes):
        """Correctly identifies PNG format."""
        info = get_image_info(rgba_image_bytes)
        assert info["format"] == "PNG"

    def test_identifies_gif_format(self, animated_gif_bytes):
        """Correctly identifies GIF format."""
        info = get_image_info(animated_gif_bytes)
        assert info["format"] == "GIF"

    def test_detects_animated_gif(self, animated_gif_bytes):
        """Returns animated=True for multi-frame GIF."""
        info = get_image_info(animated_gif_bytes)
        assert info["animated"] is True
        assert info["frames"] == 6

    def test_detects_static_image(self, rgb_image_bytes):
        """Returns animated=False for static image."""
        info = get_image_info(rgb_image_bytes)
        assert info["animated"] is False
        assert info["frames"] == 1

    def test_returns_mode_info(self, rgba_image_bytes):
        """Returns the correct color mode."""
        info = get_image_info(rgba_image_bytes)
        assert info["mode"] == "RGBA"

    def test_empty_bytes_returns_error(self, empty_bytes):
        """Empty input returns error dict."""
        info = get_image_info(empty_bytes)
        assert "error" in info

    def test_corrupted_bytes_returns_error(self, corrupted_bytes):
        """Corrupted input returns error dict."""
        info = get_image_info(corrupted_bytes)
        assert "error" in info

    def test_palette_image_mode(self, palette_image_bytes):
        """Indexed-color (P mode) image is correctly identified."""
        info = get_image_info(palette_image_bytes)
        assert info["format"] == "PNG"
        assert info["width"] == 50
        assert info["height"] == 50
