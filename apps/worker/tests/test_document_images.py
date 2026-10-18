# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from io import BytesIO

from PIL import Image

from docuvate_worker.infrastructure.extractors.document_images import extract_document_images
from tests.synthetic_scan_pdfs import scanned_image_only_pdf


def test_extract_embedded_image_from_scanned_pdf() -> None:
    images = extract_document_images(scanned_image_only_pdf(), "application/pdf", None)
    assert len(images) >= 1
    first = images[0]
    assert first.page == 1
    assert first.kind == "embedded"
    assert first.width > 0.5
    assert first.height > 0.5
    assert len(first.thumbnail_png) > 100


def test_extract_raster_upload_as_single_image() -> None:
    buf = BytesIO()
    Image.new("RGB", (320, 200), color=(30, 120, 200)).save(buf, format="PNG")
    png = buf.getvalue()
    images = extract_document_images(png, "image/png", None)
    assert len(images) == 1
    assert images[0].page == 1
    assert images[0].kind == "embedded"
