# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Rasterize PDF pages one at a time to bound peak memory."""

from __future__ import annotations

import math
import os
from collections.abc import Iterator

from pdf2image import convert_from_bytes
from PIL import Image

_ENV_RASTER_DPI = "DOCUVATE_PDF_RASTER_DPI"
_ENV_RASTER_MAX_DPI = "DOCUVATE_PDF_RASTER_MAX_DPI"
_ENV_RASTER_MAX_PIXELS = "DOCUVATE_PDF_RASTER_MAX_PIXELS"
_DEFAULT_DPI = 200
_DEFAULT_MAX_DPI = 200
_DEFAULT_MAX_PIXELS = 4_000_000


def pdf_raster_dpi() -> int:
    raw = os.environ.get(_ENV_RASTER_DPI, str(_DEFAULT_DPI)).strip()
    try:
        parsed = int(raw)
    except ValueError:
        parsed = _DEFAULT_DPI
    max_dpi = pdf_raster_max_dpi()
    return max(72, min(parsed, max_dpi))


def pdf_raster_max_dpi() -> int:
    raw = os.environ.get(_ENV_RASTER_MAX_DPI, str(_DEFAULT_MAX_DPI)).strip()
    try:
        parsed = int(raw)
    except ValueError:
        parsed = _DEFAULT_MAX_DPI
    return max(72, min(parsed, 400))


def pdf_raster_max_pixels_per_page() -> int:
    raw = os.environ.get(_ENV_RASTER_MAX_PIXELS, str(_DEFAULT_MAX_PIXELS)).strip()
    try:
        parsed = int(raw)
    except ValueError:
        parsed = _DEFAULT_MAX_PIXELS
    return max(256 * 256, parsed)


def _cap_image_pixels(image: Image.Image, max_pixels: int) -> Image.Image:
    width, height = image.size
    pixels = width * height
    if pixels <= max_pixels:
        return image
    scale = math.sqrt(max_pixels / float(pixels))
    new_width = max(1, int(width * scale))
    new_height = max(1, int(height * scale))
    resized = image.resize((new_width, new_height), Image.Resampling.BILINEAR)
    image.close()
    return resized


def iter_pdf_page_images(
    content: bytes,
    *,
    dpi: int | None = None,
    max_pages: int | None = None,
) -> Iterator[tuple[int, Image.Image]]:
    resolved_dpi = dpi if dpi is not None else pdf_raster_dpi()
    resolved_dpi = max(72, min(resolved_dpi, pdf_raster_max_dpi()))
    max_pixels = pdf_raster_max_pixels_per_page()
    page_num = 1
    while True:
        if max_pages is not None and page_num > max_pages:
            return
        try:
            batch = convert_from_bytes(
                content,
                dpi=resolved_dpi,
                first_page=page_num,
                last_page=page_num,
            )
        except Exception:
            return
        if not batch:
            return
        try:
            yield page_num, _cap_image_pixels(batch[0], max_pixels)
        finally:
            for extra in batch[1:]:
                extra.close()
        page_num += 1
