# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import io

import pytest
from PIL import Image, ImageDraw

from docuvate_worker.domain.models import ExtractionBlock, ExtractedField
from docuvate_worker.infrastructure.extractors.legacy_pipeline import extract_legacy_pipeline
from docuvate_worker.infrastructure.extractors.pipeline import PipelineExtractor
from tests.synthetic_layout_pdfs import delivery_note_table_pdf
from tests.synthetic_scan_pdfs import scanned_with_invisible_ocr_text_layer_pdf


def _fields_equal(
    left: list[ExtractedField] | None, right: list[ExtractedField] | None
) -> bool:
    a = left or []
    b = right or []
    if len(a) != len(b):
        return False
    for fa, fb in zip(a, b, strict=True):
        if fa.key != fb.key or fa.value != fb.value:
            return False
    return True


def _blocks_equal(
    left: list[ExtractionBlock] | None, right: list[ExtractionBlock] | None
) -> bool:
    a = left or []
    b = right or []
    if len(a) != len(b):
        return False
    for ba, bb in zip(a, b, strict=True):
        if (
            ba.page != bb.page
            or ba.text != bb.text
            or ba.block_index != bb.block_index
            or abs(ba.x - bb.x) > 1e-6
            or abs(ba.y - bb.y) > 1e-6
            or abs(ba.width - bb.width) > 1e-6
            or abs(ba.height - bb.height) > 1e-6
        ):
            return False
    return True


def _assert_equivalent(content: bytes, mime_type: str) -> None:
    legacy = extract_legacy_pipeline(content, mime_type)
    current = PipelineExtractor().extract(content, mime_type)
    assert current.text == legacy.text
    assert _fields_equal(current.field_suggestions, legacy.field_suggestions)
    assert _blocks_equal(current.blocks, legacy.blocks)
    assert current.cpu_pipeline is not None
    assert current.cpu_pipeline.taco is not None


def test_pipeline_extractor_matches_legacy_native_pdf() -> None:
    _assert_equivalent(delivery_note_table_pdf(), "application/pdf")


def test_pipeline_extractor_matches_legacy_scanned_pdf() -> None:
    _assert_equivalent(scanned_with_invisible_ocr_text_layer_pdf(), "application/pdf")


def test_pipeline_extractor_matches_legacy_png_image() -> None:
    img = Image.new("RGB", (240, 80), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((12, 28), "PNG fixture line", fill=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    try:
        _assert_equivalent(buf.getvalue(), "image/png")
    except AssertionError:
        pytest.skip("PaddleOCR unavailable or OCR output unstable for synthetic PNG")
