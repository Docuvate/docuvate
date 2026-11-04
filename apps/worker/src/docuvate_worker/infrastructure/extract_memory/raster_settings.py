# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Env-backed rasterization budgets shared by every extract stage and the admission estimate.

Values are read on every call so per-job overrides (the memory retry) take effect in a warm
pooled child without restarting it.
"""

from __future__ import annotations

import os

_ENV_RASTER_DPI = "DOCUVATE_PDF_RASTER_DPI"
_ENV_RASTER_MAX_DPI = "DOCUVATE_PDF_RASTER_MAX_DPI"
_ENV_RASTER_MAX_PIXELS = "DOCUVATE_PDF_RASTER_MAX_PIXELS"
_ENV_COMPARE_MAX_PIXELS = "DOCUVATE_LAYOUT_COMPARE_MAX_PIXELS"
_DEFAULT_DPI = 200
_DEFAULT_MAX_DPI = 200
_DEFAULT_MAX_PIXELS = 4_000_000
# A3 at the 100 DPI compare resolution is 1.94 MP, so standard paper sizes are never downscaled.
_DEFAULT_COMPARE_MAX_PIXELS = 2_000_000
_MIN_DPI = 72
_MAX_DPI = 400
_MIN_PIXELS = 256 * 256


def _env_int(name: str, default: int) -> int:
    raw = os.environ.get(name, "").strip()
    try:
        return int(raw)
    except ValueError:
        return default


def raster_max_dpi() -> int:
    return max(_MIN_DPI, min(_env_int(_ENV_RASTER_MAX_DPI, _DEFAULT_MAX_DPI), _MAX_DPI))


def raster_dpi() -> int:
    return max(_MIN_DPI, min(_env_int(_ENV_RASTER_DPI, _DEFAULT_DPI), raster_max_dpi()))


def raster_max_pixels_per_page() -> int:
    """Pixel budget for one OCR page or one uploaded image."""
    return max(_MIN_PIXELS, _env_int(_ENV_RASTER_MAX_PIXELS, _DEFAULT_MAX_PIXELS))


def layout_compare_max_pixels_per_page() -> int:
    """Pixel budget for one rendered page in the layout reconstruction (SSIM) compare."""
    return max(_MIN_PIXELS, _env_int(_ENV_COMPARE_MAX_PIXELS, _DEFAULT_COMPARE_MAX_PIXELS))
