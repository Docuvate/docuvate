# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Rasterize PDF pages one at a time to bound peak memory."""

from __future__ import annotations

from collections.abc import Iterator

from PIL import Image

from docuvate_worker.infrastructure.extract_memory.bounded_raster import (
    pdf_page_size_pt,
    render_pdf_page_at_dpi,
)
from docuvate_worker.infrastructure.extract_memory.pixel_budget import effective_raster_dpi
from docuvate_worker.infrastructure.extract_memory.raster_settings import (
    raster_dpi,
    raster_max_dpi,
    raster_max_pixels_per_page,
)
from docuvate_worker.infrastructure.worker_memory_hygiene import reclaim_python_heap


def iter_pdf_page_images(
    content: bytes,
    *,
    dpi: int | None = None,
    max_pages: int | None = None,
) -> Iterator[tuple[int, Image.Image]]:
    target_dpi = dpi if dpi is not None else raster_dpi()
    max_dpi = raster_max_dpi()
    max_pixels = raster_max_pixels_per_page()
    page_num = 1
    while True:
        if max_pages is not None and page_num > max_pages:
            return
        width_pt, height_pt = pdf_page_size_pt(content, page_num)
        resolved_dpi = effective_raster_dpi(
            width_pt,
            height_pt,
            target_dpi=target_dpi,
            max_dpi=max_dpi,
            max_pixels_per_page=max_pixels,
        )
        try:
            image = render_pdf_page_at_dpi(
                content, page_num, dpi=resolved_dpi, max_pixels=max_pixels
            )
        except Exception:
            return
        if image is None:
            return
        try:
            yield page_num, image
        finally:
            reclaim_python_heap()
        page_num += 1
