# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Every rasterizing extract stage stays within its pixel budget, whatever the MediaBox says."""

from __future__ import annotations

import io
import shutil

import pytest
from PIL import Image
from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject

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


def _rotate_pdf(pdf: bytes, degrees: int) -> bytes:
    reader = PdfReader(io.BytesIO(pdf))
    writer = PdfWriter()
    page = reader.pages[0]
    page.rotate(degrees)
    writer.add_page(page)
    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()


def _crop_pdf(pdf: bytes, width: float, height: float) -> bytes:
    reader = PdfReader(io.BytesIO(pdf))
    writer = PdfWriter()
    page = reader.pages[0]
    page.cropbox = RectangleObject((0, 0, width, height))
    writer.add_page(page)
    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()


def test_pdf_page_size_falls_back_to_letter_for_unreadable_input() -> None:
    assert pdf_page_size_pt(b"not a pdf", 1) == (612.0, 792.0)


def test_native_rotate_swaps_the_emitted_axes() -> None:
    pdf = _pdf_with_page_pt(595, 842)
    assert pdf_page_size_pt(_rotate_pdf(pdf, 90), 1) == (842.0, 595.0)
    assert pdf_page_size_pt(_rotate_pdf(pdf, 270), 1) == (842.0, 595.0)
    assert pdf_page_size_pt(_rotate_pdf(pdf, 180), 1) == (595.0, 842.0)


def test_default_budget_uses_mediabox_not_the_smaller_cropbox() -> None:
    cropped = _crop_pdf(_pdf_with_page_pt(2000, 2000), 200, 300)
    assert pdf_page_size_pt(cropped, 1) == (2000.0, 2000.0)
    assert pdf_page_size_pt(cropped, 1, use_cropbox=True) == (200.0, 300.0)
    budget = 1_000_000
    default_dpi = bounded_page_dpi(cropped, 1, dpi=72, max_pixels=budget)
    crop_dpi = bounded_page_dpi(cropped, 1, dpi=72, max_pixels=budget, use_cropbox=True)
    assert default_dpi < crop_dpi


def test_quarter_turn_does_not_raise_the_pixel_budget() -> None:
    upright = _pdf_with_page_pt(*_PHONE_SCAN_PX)
    turned = _rotate_pdf(upright, 90)
    budget = 1_000_000
    assert bounded_page_dpi(turned, 1, dpi=DEFAULT_COMPARE_DPI, max_pixels=budget) == (
        bounded_page_dpi(upright, 1, dpi=DEFAULT_COMPARE_DPI, max_pixels=budget)
    )


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


@_needs_poppler
def test_rotated_render_matches_the_budgeted_size() -> None:
    pdf = _rotate_pdf(_pdf_with_page_pt(595, 842), 90)
    size = pdf_page_size_pt(pdf, 1)
    image = render_pdf_page_bounded(pdf, 1, dpi=72, max_pixels=2_000_000)
    assert image is not None
    with image:
        assert image.size == (round(size[0]), round(size[1]))


@_needs_poppler
def test_default_render_keeps_the_mediabox_when_cropbox_is_smaller() -> None:
    pdf = _crop_pdf(_pdf_with_page_pt(400, 400), 100, 120)
    image = render_pdf_page_bounded(pdf, 1, dpi=72, max_pixels=2_000_000)
    assert image is not None
    with image:
        assert image.size == (400, 400)
    cropped = render_pdf_page_bounded(pdf, 1, dpi=72, max_pixels=2_000_000, use_cropbox=True)
    assert cropped is not None
    with cropped:
        assert cropped.size == (100, 120)


def test_compare_peak_estimate_follows_the_compare_budget(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("DOCUVATE_LAYOUT_COMPARE_MAX_PIXELS", "1000000")
    reduced = layout_compare_peak_bytes()
    monkeypatch.setenv("DOCUVATE_LAYOUT_COMPARE_MAX_PIXELS", "2000000")
    assert layout_compare_peak_bytes() == 2 * reduced
