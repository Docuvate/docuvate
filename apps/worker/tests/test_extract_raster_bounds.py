# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Every rasterizing extract stage stays within its pixel budget, whatever the MediaBox says."""

from __future__ import annotations

import io
import shutil

import pytest
from PIL import Image

from docuvate_worker.infrastructure.extract_memory.admission import layout_compare_peak_bytes
from docuvate_worker.infrastructure.extract_memory.bounded_raster import (
    bounded_page_dpi,
    open_image_bounded,
    pdf_page_size_pt,
    render_pdf_page_bounded,
)
from docuvate_worker.infrastructure.extract_memory.raster_settings import (
    layout_compare_max_pixels_per_page,
)
from docuvate_worker.infrastructure.layout.pixel_compare import (
    DEFAULT_COMPARE_DPI,
    compare_pdf_pages,
    compare_render_dpi,
)

_PHONE_SCAN_PX = (2400, 3200)
_A4_PT = (595.0, 842.0)
_needs_poppler = pytest.mark.skipif(shutil.which("pdftoppm") is None, reason="poppler required")


def _pdf_with_page_pt(width_pt: int, height_pt: int) -> bytes:
    """Image-only PDF at 72 DPI, so its MediaBox in points equals the pixel size (phone scans)."""
    buf = io.BytesIO()
    Image.new("L", (width_pt, height_pt), color=255).save(buf, format="PDF", resolution=72.0)
    return buf.getvalue()


def test_pdf_page_size_reads_the_mediabox() -> None:
    pdf = _pdf_with_page_pt(*_PHONE_SCAN_PX)
    assert pdf_page_size_pt(pdf, 1) == (float(_PHONE_SCAN_PX[0]), float(_PHONE_SCAN_PX[1]))


def test_pdf_page_size_falls_back_to_letter_for_unreadable_input() -> None:
    assert pdf_page_size_pt(b"not a pdf", 1) == (612.0, 792.0)


def test_bounded_dpi_keeps_standard_paper_at_the_compare_resolution() -> None:
    a4 = _pdf_with_page_pt(int(_A4_PT[0]), int(_A4_PT[1]))
    budget = layout_compare_max_pixels_per_page()
    assert bounded_page_dpi(a4, 1, dpi=DEFAULT_COMPARE_DPI, max_pixels=budget) == (
        DEFAULT_COMPARE_DPI
    )


def test_bounded_dpi_lowers_resolution_for_a_pixel_sized_mediabox() -> None:
    pdf = _pdf_with_page_pt(*_PHONE_SCAN_PX)
    budget = 1_000_000
    dpi = bounded_page_dpi(pdf, 1, dpi=DEFAULT_COMPARE_DPI, max_pixels=budget)
    width_px = int(_PHONE_SCAN_PX[0] * dpi / 72)
    height_px = int(_PHONE_SCAN_PX[1] * dpi / 72)
    assert dpi < DEFAULT_COMPARE_DPI
    assert width_px * height_px <= budget


def test_compare_dpi_is_shared_by_both_renders_and_fits_the_larger_page() -> None:
    small = _pdf_with_page_pt(int(_A4_PT[0]), int(_A4_PT[1]))
    large = _pdf_with_page_pt(*_PHONE_SCAN_PX)
    budget = 1_000_000
    shared = compare_render_dpi(
        small, large, page_number=1, dpi=DEFAULT_COMPARE_DPI, max_pixels=budget
    )
    assert shared == bounded_page_dpi(large, 1, dpi=DEFAULT_COMPARE_DPI, max_pixels=budget)


@_needs_poppler
def test_layout_compare_renders_stay_within_the_pixel_budget(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    budget = 500_000
    monkeypatch.setenv("DOCUVATE_LAYOUT_COMPARE_MAX_PIXELS", str(budget))
    pdf = _pdf_with_page_pt(*_PHONE_SCAN_PX)
    result = compare_pdf_pages(pdf, pdf)
    assert result.original_gray.size <= budget
    assert result.reconstruction_gray.shape == result.original_gray.shape


@_needs_poppler
def test_bounded_page_render_never_exceeds_the_budget() -> None:
    pdf = _pdf_with_page_pt(*_PHONE_SCAN_PX)
    budget = 300_000
    image = render_pdf_page_bounded(pdf, 1, dpi=72, max_pixels=budget)
    assert image is not None
    with image:
        assert image.width * image.height <= budget


def test_open_image_bounded_downscales_large_jpeg_and_png() -> None:
    budget = 200_000
    for fmt in ("JPEG", "PNG"):
        buf = io.BytesIO()
        Image.new("RGB", _PHONE_SCAN_PX, color=(255, 255, 255)).save(buf, format=fmt)
        with open_image_bounded(buf.getvalue(), budget) as image:
            assert image.width * image.height <= budget


def test_open_image_bounded_keeps_small_images_unchanged() -> None:
    buf = io.BytesIO()
    Image.new("RGB", (320, 200)).save(buf, format="PNG")
    with open_image_bounded(buf.getvalue(), 1_000_000) as image:
        assert image.size == (320, 200)


def test_compare_peak_estimate_follows_the_compare_budget(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("DOCUVATE_LAYOUT_COMPARE_MAX_PIXELS", "1000000")
    reduced = layout_compare_peak_bytes()
    monkeypatch.setenv("DOCUVATE_LAYOUT_COMPARE_MAX_PIXELS", "2000000")
    assert layout_compare_peak_bytes() == 2 * reduced
