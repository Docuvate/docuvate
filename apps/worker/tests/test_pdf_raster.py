# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import shutil

import pytest

from docuvate_worker.infrastructure.extractors.pdf_raster import (
    iter_pdf_page_images,
    pdf_raster_max_pixels_per_page,
)
from tests.synthetic_scan_pdfs import scanned_image_only_multipage_pdf


@pytest.mark.skipif(shutil.which("pdftoppm") is None, reason="poppler required for pdf2image")
def test_iter_pdf_page_images_yields_one_page_at_a_time() -> None:
    expected_pages = 5
    pdf = scanned_image_only_multipage_pdf(page_count=expected_pages)
    pages = list(iter_pdf_page_images(pdf, dpi=72))
    assert len(pages) == expected_pages
    for index, (page_num, image) in enumerate(pages, start=1):
        assert page_num == index
        try:
            assert image.width > 0
            assert image.height > 0
        finally:
            image.close()


def test_raster_caps_pixels_per_page(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DOCUVATE_PDF_RASTER_MAX_PIXELS", "100000")
    assert pdf_raster_max_pixels_per_page() == 100000
