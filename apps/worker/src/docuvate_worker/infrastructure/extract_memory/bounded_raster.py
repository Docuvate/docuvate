# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Pixel-bounded PDF page rendering and image decoding shared by every extract stage.

The budget uses the box poppler will actually emit. The default is the MediaBox
(/Rotate 90 and 270 swap the axes). CropBox is used only when the caller also
passes use_cropbox=True to the renderer. Budgeting the smaller CropBox while
poppler still paints the MediaBox would raise DPI and blow the pixel cap.
"""

from __future__ import annotations

import io

from pdf2image import convert_from_bytes
from PIL import Image
from pypdf import PdfReader

from docuvate_worker.infrastructure.extract_memory.pixel_budget import (
    cap_pixels_for_page,
    effective_raster_dpi,
)

_LETTER_PT = (612.0, 792.0)


def pdf_page_size_pt(
    content: bytes, page_number: int, *, use_cropbox: bool = False
) -> tuple[float, float]:
    """Point size of the bitmap poppler emits, before DPI is applied.

    US Letter when the page cannot be read. ``use_cropbox`` must match the flag
    passed to ``convert_from_bytes``.
    """
    try:
        page = PdfReader(io.BytesIO(content)).pages[page_number - 1]
        box = page.cropbox if use_cropbox else page.mediabox
        unit = float(page.user_unit)
        width = float(box.width) * unit
        height = float(box.height) * unit
        quarter = int(page.rotation or 0) % 360
        if quarter in (90, 270):
            return height, width
        else:
            return width, height
    except Exception:
        return _LETTER_PT


def bounded_page_dpi(
    content: bytes,
    page_number: int,
    *,
    dpi: int,
    max_pixels: int,
    use_cropbox: bool = False,
) -> int:
    """Highest DPI up to ``dpi`` that keeps the rendered page within ``max_pixels``."""
    width_pt, height_pt = pdf_page_size_pt(content, page_number, use_cropbox=use_cropbox)
    return effective_raster_dpi(
        width_pt,
        height_pt,
        target_dpi=dpi,
        max_dpi=dpi,
        max_pixels_per_page=max_pixels,
    )


def cap_image_pixels(image: Image.Image, max_pixels: int) -> Image.Image:
    """Downscale ``image`` to at most ``max_pixels``; closes the original when resized."""
    width, height = image.size
    new_w, new_h = cap_pixels_for_page(width, height, max_pixels)
    if new_w == width and new_h == height:
        return image
    resized = image.resize((new_w, new_h), Image.Resampling.BILINEAR)
    image.close()
    return resized


def render_pdf_page_at_dpi(
    content: bytes,
    page_number: int,
    *,
    dpi: int,
    max_pixels: int,
    use_cropbox: bool = False,
) -> Image.Image | None:
    """Render one page at ``dpi`` (already bounded by the caller) and enforce ``max_pixels``."""
    images = convert_from_bytes(
        content,
        dpi=dpi,
        first_page=page_number,
        last_page=page_number,
        use_cropbox=use_cropbox,
    )
    if not images:
        return None
    for extra in images[1:]:
        extra.close()
    return cap_image_pixels(images[0], max_pixels)


def render_pdf_page_bounded(
    content: bytes,
    page_number: int,
    *,
    dpi: int,
    max_pixels: int,
    use_cropbox: bool = False,
) -> Image.Image | None:
    """Render one page at the highest DPI up to ``dpi`` that fits ``max_pixels``."""
    resolved = bounded_page_dpi(
        content, page_number, dpi=dpi, max_pixels=max_pixels, use_cropbox=use_cropbox
    )
    return render_pdf_page_at_dpi(
        content, page_number, dpi=resolved, max_pixels=max_pixels, use_cropbox=use_cropbox
    )


def open_image_bounded(raw: bytes, max_pixels: int) -> Image.Image:
    """Decode an image at most ``max_pixels`` large (JPEG decodes directly at reduced scale)."""
    image = Image.open(io.BytesIO(raw))
    target = cap_pixels_for_page(image.width, image.height, max_pixels)
    if target != image.size:
        image.draft(image.mode, target)
    return cap_image_pixels(image, max_pixels)
