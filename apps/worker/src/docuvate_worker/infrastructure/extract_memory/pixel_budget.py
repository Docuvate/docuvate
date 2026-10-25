# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Pixel-budget math for PDF rasterization (scale large pages before OCR)."""

from __future__ import annotations

import math

_POINTS_PER_INCH = 72.0


def page_pixel_count_at_dpi(width_pt: float, height_pt: float, dpi: int) -> int:
    if width_pt <= 0 or height_pt <= 0 or dpi <= 0:
        return 0
    width_px = int(width_pt * dpi / _POINTS_PER_INCH)
    height_px = int(height_pt * dpi / _POINTS_PER_INCH)
    return max(1, width_px) * max(1, height_px)


def effective_raster_dpi(
    width_pt: float,
    height_pt: float,
    *,
    target_dpi: int,
    max_dpi: int,
    max_pixels_per_page: int,
) -> int:
    """Choose the highest DPI that keeps rasterized pixels within the page budget."""
    capped_target = max(72, min(target_dpi, max_dpi))
    if page_pixel_count_at_dpi(width_pt, height_pt, capped_target) <= max_pixels_per_page:
        return capped_target
    low = 1
    high = capped_target
    best = low
    while low <= high:
        mid = (low + high) // 2
        if page_pixel_count_at_dpi(width_pt, height_pt, mid) <= max_pixels_per_page:
            best = mid
            low = mid + 1
        else:
            high = mid - 1
    return max(1, best)


def cap_pixels_for_page(
    width_px: int,
    height_px: int,
    max_pixels: int,
) -> tuple[int, int]:
    pixels = width_px * height_px
    if pixels <= max_pixels or pixels <= 0:
        return width_px, height_px
    scale = math.sqrt(max_pixels / float(pixels))
    new_w = max(1, int(width_px * scale))
    new_h = max(1, int(height_px * scale))
    return new_w, new_h
