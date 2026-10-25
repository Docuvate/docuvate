# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from docuvate_worker.infrastructure.extract_memory.admission import (
    estimate_extract_memory_bytes,
)
from docuvate_worker.infrastructure.extract_memory.pixel_budget import (
    effective_raster_dpi,
    page_pixel_count_at_dpi,
)
from tests.synthetic_scan_pdfs import scanned_image_only_multipage_pdf


def test_page_pixel_count_at_dpi_letter_size() -> None:
    pixels = page_pixel_count_at_dpi(612.0, 792.0, 200)
    assert 3_600_000 < pixels < 3_900_000


def test_effective_raster_dpi_scales_down_a0() -> None:
    # A0 landscape points (~3370 x 2384 pt) at 300 dpi would exceed budget.
    dpi = effective_raster_dpi(
        3370.0,
        2384.0,
        target_dpi=300,
        max_dpi=300,
        max_pixels_per_page=4_000_000,
    )
    assert dpi < 300
    assert page_pixel_count_at_dpi(3370.0, 2384.0, dpi) <= 4_000_000
    assert dpi >= 1


def test_estimate_extract_memory_grows_with_pages() -> None:
    small = scanned_image_only_multipage_pdf(page_count=2, dpi=120)
    large = scanned_image_only_multipage_pdf(page_count=40, dpi=120)
    assert estimate_extract_memory_bytes(large, "application/pdf") > estimate_extract_memory_bytes(
        small, "application/pdf"
    )
