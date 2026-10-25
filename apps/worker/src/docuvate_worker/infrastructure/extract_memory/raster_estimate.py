# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Raster DPI/pixel env reads for admission estimates (no pdf_raster import)."""

from __future__ import annotations

import os

_ENV_RASTER_DPI = "DOCUVATE_PDF_RASTER_DPI"
_ENV_RASTER_MAX_DPI = "DOCUVATE_PDF_RASTER_MAX_DPI"
_ENV_RASTER_MAX_PIXELS = "DOCUVATE_PDF_RASTER_MAX_PIXELS"
_DEFAULT_DPI = 200
_DEFAULT_MAX_DPI = 200
_DEFAULT_MAX_PIXELS = 4_000_000


def estimate_raster_dpi() -> int:
    raw = os.environ.get(_ENV_RASTER_DPI, str(_DEFAULT_DPI)).strip()
    try:
        parsed = int(raw)
    except ValueError:
        parsed = _DEFAULT_DPI
    max_dpi = estimate_raster_max_dpi()
    return max(72, min(parsed, max_dpi))


def estimate_raster_max_dpi() -> int:
    raw = os.environ.get(_ENV_RASTER_MAX_DPI, str(_DEFAULT_MAX_DPI)).strip()
    try:
        parsed = int(raw)
    except ValueError:
        parsed = _DEFAULT_MAX_DPI
    return max(72, min(parsed, 400))


def estimate_raster_max_pixels_per_page() -> int:
    raw = os.environ.get(_ENV_RASTER_MAX_PIXELS, str(_DEFAULT_MAX_PIXELS)).strip()
    try:
        parsed = int(raw)
    except ValueError:
        parsed = _DEFAULT_MAX_PIXELS
    return max(256 * 256, parsed)
