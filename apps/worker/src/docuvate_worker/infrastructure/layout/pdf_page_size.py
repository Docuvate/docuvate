# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Read PDF media box sizes for layout IR fallbacks."""

from __future__ import annotations

import io

_DEFAULT_WIDTH_PT = 612.0
_DEFAULT_HEIGHT_PT = 792.0


def _page_size_pt(page) -> tuple[float, float]:
    # pdfplumber already applies /Rotate to width and height; do not swap again.
    width = float(page.width or _DEFAULT_WIDTH_PT)
    height = float(page.height or _DEFAULT_HEIGHT_PT)
    if width <= 0 or height <= 0:
        return _DEFAULT_WIDTH_PT, _DEFAULT_HEIGHT_PT
    return width, height


def pdf_page_sizes_pt(content: bytes) -> dict[int, tuple[float, float]]:
    import pdfplumber  # noqa: PLC0415

    sizes: dict[int, tuple[float, float]] = {}
    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for index, page in enumerate(pdf.pages, start=1):
                sizes[index] = _page_size_pt(page)
    except Exception:
        return {1: (_DEFAULT_WIDTH_PT, _DEFAULT_HEIGHT_PT)}
    if not sizes:
        return {1: (_DEFAULT_WIDTH_PT, _DEFAULT_HEIGHT_PT)}
    return sizes


def pdf_first_page_size_pt(content: bytes) -> tuple[float, float]:
    sizes = pdf_page_sizes_pt(content)
    return sizes.get(1, (_DEFAULT_WIDTH_PT, _DEFAULT_HEIGHT_PT))


def image_size_pt_from_pixels(
    width_px: int,
    height_px: int,
    *,
    dpi_x: float | None = None,
    dpi_y: float | None = None,
) -> tuple[float, float]:
    if width_px <= 0 or height_px <= 0:
        return _DEFAULT_WIDTH_PT, _DEFAULT_HEIGHT_PT
    dx = dpi_x if dpi_x and dpi_x > 0 else 72.0
    dy = dpi_y if dpi_y and dpi_y > 0 else dx
    return (width_px / dx) * 72.0, (height_px / dy) * 72.0
