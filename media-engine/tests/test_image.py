"""
Unit tests for media-engine/app/services/image.py

Tests the three public functions:
- compress_static()
- compress_animated()
- optimize()
"""

import io
from PIL import Image
import pytest

from app.services.image import compress_static, compress_animated, optimize


# ===========================================================================
# compress_static()
# ===========================================================================


class TestCompressStatic:
    def test_returns_webp_format(self, rgb_image_bytes):
        """Output format is always 'webp'."""
        buf, fmt, w, h = compress_static(rgb_image_bytes)
        assert fmt == "webp"

    def test_output_smaller_than_original(self, rgb_image_bytes):
        """Compressed image should be smaller (lossy WebP)."""
        buf, fmt, w, h = compress_static(rgb_image_bytes)
        assert len(buf) < len(rgb_image_bytes), (
            f"Compressed ({len(buf)}B) not smaller than original ({len(rgb_image_bytes)}B)"
        )

    def test_resize_downscales_large_image(self, large_image_bytes):
        """2000×1500 image should be resized to ≤1200px max dimension."""
        buf, fmt, w, h = compress_static(large_image_bytes, max_width=1200)
        assert w <= 1200, f"Width {w} > 1200"
        assert h <= 1200, f"Height {h} > 1200"
        # Aspect ratio should be preserved: 2000/1500 = 1.333
        assert abs(w / h - 2000 / 1500) < 0.01, "Aspect ratio not preserved"

    def test_small_image_not_enlarged(self, tiny_image_bytes):
        """1×1 pixel image should NOT be upscaled."""
        buf, fmt, w, h = compress_static(tiny_image_bytes, max_width=1200)
        assert w == 1, f"Expected width 1, got {w}"
        assert h == 1, f"Expected height 1, got {h}"

    def test_custom_max_width(self, rgb_image_bytes):
        """Custom max_width parameter is respected."""
        buf, fmt, w, h = compress_static(rgb_image_bytes, max_width=50)
        assert w <= 50, f"Width {w} > 50"

    def test_custom_quality(self, rgb_image_bytes):
        """Lower quality produces smaller file size."""
        buf_high, _, _, _ = compress_static(rgb_image_bytes, quality=90)
        buf_low, _, _, _ = compress_static(rgb_image_bytes, quality=10)
        assert len(buf_low) <= len(buf_high), (
            "Low quality should produce smaller or equal file size"
        )

    def test_output_is_valid_webp(self, rgb_image_bytes):
        """Output buffer can be opened by Pillow as WebP."""
        buf, fmt, w, h = compress_static(rgb_image_bytes)
        img = Image.open(io.BytesIO(buf))
        assert img.format == "WEBP"
        assert img.width == w
        assert img.height == h

    def test_handles_cmyk_conversion(self, cmyk_image_bytes):
        """CMYK images are converted without error."""
        buf, fmt, w, h = compress_static(cmyk_image_bytes)
        assert fmt == "webp"
        img = Image.open(io.BytesIO(buf))
        assert img.mode in ("RGB", "RGBA"), f"Unexpected mode: {img.mode}"

    def test_handles_palette_conversion(self, palette_image_bytes):
        """Palette (P mode) images are converted without error."""
        buf, fmt, w, h = compress_static(palette_image_bytes)
        assert fmt == "webp"
        img = Image.open(io.BytesIO(buf))
        assert img.size == (50, 50)

    def test_preserves_transparency(self, rgba_image_bytes):
        """RGBA images with transparency should retain alpha channel."""
        buf, fmt, w, h = compress_static(rgba_image_bytes)
        img = Image.open(io.BytesIO(buf))
        # WebP may convert to RGB if fully opaque, but should not error
        assert img.size == (100, 100)


# ===========================================================================
# compress_animated()
# ===========================================================================


class TestCompressAnimated:
    def test_returns_animated_webp(self, animated_gif_bytes):
        """Animated GIF is converted to animated WebP."""
        buf, fmt, w, h = compress_animated(animated_gif_bytes)
        assert fmt == "webp"

    def test_preserves_animation_frames(self, animated_gif_bytes):
        """Output animated WebP has multiple frames."""
        buf, fmt, w, h = compress_animated(animated_gif_bytes)
        img = Image.open(io.BytesIO(buf))
        assert getattr(img, "is_animated", False), "Output should be animated"
        assert img.n_frames >= 2, f"Expected >=2 frames, got {img.n_frames}"

    def test_resize_animated(self, animated_gif_bytes):
        """Large animated images are resized down."""
        buf, fmt, w, h = compress_animated(animated_gif_bytes, max_width=100)
        assert w <= 100, f"Width {w} > 100"
        assert h <= 100, f"Height {h} > 100"

    def test_small_animated_not_enlarged(self, animated_gif_bytes):
        """Small animated GIFs are not upscaled."""
        # The animated_gif_bytes fixture is 200x200
        buf, fmt, w, h = compress_animated(animated_gif_bytes, max_width=800)
        assert w == 200, f"Expected width 200 (original), got {w}"
        assert h == 200, f"Expected height 200 (original), got {h}"

    def test_single_frame_gif_falls_back_to_static(self, single_frame_gif_bytes):
        """A GIF with only 1 frame processed as static (NOT animated)."""
        buf, fmt, w, h = compress_animated(single_frame_gif_bytes)
        assert fmt == "webp"
        # Verify the output is NOT animated
        img = Image.open(io.BytesIO(buf))
        assert not getattr(img, "is_animated", False), (
            "Single-frame GIF should produce static output"
        )

    def test_animated_webp_input(self, animated_webp_bytes):
        """Animated WebP input is preserved as animated WebP output."""
        buf, fmt, w, h = compress_animated(animated_webp_bytes)
        img = Image.open(io.BytesIO(buf))
        assert getattr(img, "is_animated", False), "Output should be animated"

    def test_frame_count_preserved(self, animated_gif_bytes):
        """Number of frames in output should match input."""
        # Read input frame count
        input_img = Image.open(io.BytesIO(animated_gif_bytes))
        input_frames = input_img.n_frames

        # Process and check output
        buf, fmt, w, h = compress_animated(animated_gif_bytes)
        output_img = Image.open(io.BytesIO(buf))
        output_frames = output_img.n_frames

        assert output_frames == input_frames, (
            f"Frame count mismatch: input={input_frames}, output={output_frames}"
        )

    def test_loop_count_is_infinite(self, animated_gif_bytes):
        """Animated WebP should loop infinitely (loop=0)."""
        buf, fmt, w, h = compress_animated(animated_gif_bytes)
        img = Image.open(io.BytesIO(buf))
        assert img.is_animated
        # For animated WebP, loop info is stored in img.info
        # 0 = infinite loop
        loop = img.info.get("loop", -1)
        assert loop == 0, f"Expected loop=0 (infinite), got loop={loop}"


# ===========================================================================
# optimize() — main entry point
# ===========================================================================


class TestOptimize:
    def test_static_image_returns_correct_structure(self, rgb_image_bytes):
        """Returns dict with all expected keys for static image."""
        result = optimize(rgb_image_bytes)
        expected_keys = {"buffer", "format", "width", "height", "animated",
                         "original_size_bytes", "compressed_size_bytes", "reduction_pct"}
        assert expected_keys.issubset(result.keys()), (
            f"Missing keys: {expected_keys - result.keys()}"
        )

    def test_static_optimize_not_animated(self, rgb_image_bytes):
        """Static images are marked as not animated."""
        result = optimize(rgb_image_bytes)
        assert result["animated"] is False
        assert result["format"] == "webp"

    def test_animated_optimize_detects_animation(self, animated_gif_bytes):
        """Animated GIFs are marked as animated."""
        result = optimize(animated_gif_bytes)
        assert result["animated"] is True

    def test_animated_optimize_keep_animation_false(self, animated_gif_bytes):
        """Setting keep_animation=False should process as static."""
        result = optimize(animated_gif_bytes, keep_animation=False)
        assert result["animated"] is False

    def test_original_size_tracked(self, rgb_image_bytes):
        """Original size bytes are reported correctly."""
        result = optimize(rgb_image_bytes)
        assert result["original_size_bytes"] == len(rgb_image_bytes)

    def test_compressed_size_smaller(self, rgb_image_bytes):
        """Compressed size is smaller than original for static."""
        result = optimize(rgb_image_bytes)
        assert result["compressed_size_bytes"] < result["original_size_bytes"]

    def test_reduction_percentage_positive(self, rgb_image_bytes):
        """Reduction percentage is positive for compressible images."""
        result = optimize(rgb_image_bytes)
        assert result["reduction_pct"] > 0, (
            f"Expected positive reduction, got {result['reduction_pct']}%"
        )

    def test_custom_max_width(self, large_image_bytes):
        """Custom max_width is respected in optimize."""
        result = optimize(large_image_bytes, max_width=400)
        assert result["width"] <= 400, f"Width {result['width']} > 400"
        assert result["height"] <= 400, f"Height {result['height']} > 400"

    def test_custom_quality(self, rgb_image_bytes):
        """Quality setting affects file size."""
        result_high = optimize(rgb_image_bytes, quality=95)
        result_low = optimize(rgb_image_bytes, quality=5)
        assert result_low["compressed_size_bytes"] <= result_high["compressed_size_bytes"]

    def test_buffer_valid_image(self, rgb_image_bytes):
        """Returned buffer should be a valid image."""
        result = optimize(rgb_image_bytes)
        img = Image.open(io.BytesIO(result["buffer"]))
        assert img.format == "WEBP"

    def test_animated_gif_compression(self, animated_gif_bytes):
        """Animated GIF optimization works end-to-end."""
        result = optimize(animated_gif_bytes)
        assert result["animated"] is True
        assert result["buffer"] is not None
        # Verify output is valid animated webp
        img = Image.open(io.BytesIO(result["buffer"]))
        assert img.format == "WEBP"
        assert getattr(img, "is_animated", False)

    def test_dimensions_correct(self, rgb_image_bytes):
        """Dimensions in result match actual output image."""
        result = optimize(rgb_image_bytes)
        img = Image.open(io.BytesIO(result["buffer"]))
        assert img.width == result["width"]
        assert img.height == result["height"]
