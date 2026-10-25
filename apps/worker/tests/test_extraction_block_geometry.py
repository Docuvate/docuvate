# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import math

import pytest

from docuvate_worker.domain.extraction_geometry import (
    PageDimensions,
    UNIT_INTERVAL_EPSILON,
    clamp_to_unit_interval,
    extraction_block_from_absolute,
    extraction_block_from_normalized,
    sanitize_extraction_blocks,
)
from docuvate_worker.domain.models import ExtractionBlock
from docuvate_worker.infrastructure.extractors.paddle_engine import _box_to_block
from docuvate_worker.infrastructure.extractors.pdf_native import try_extract_pdf_native
from docuvate_worker.infrastructure.extractors.rapidocr_engine import _blocks_from_ocr_result
from docuvate_worker.presentation.extraction_block_response import extraction_blocks_to_models


def test_clamp_tiny_overshoot_to_unit_interval() -> None:
    assert clamp_to_unit_interval(1.0 + UNIT_INTERVAL_EPSILON * 0.5) == 1.0
    assert math.isnan(clamp_to_unit_interval(366.18))


def test_extraction_block_from_absolute_pdf_points() -> None:
    page = PageDimensions(width=612.0, height=792.0)
    block = extraction_block_from_absolute(
        page=1,
        x0=366.18,
        y0=66.77,
        x1=366.18 + 397.67,
        y1=66.77 + 12.0,
        page_size=page,
        text="Invoice",
        block_index=0,
    )
    assert block is not None
    assert block.x == block.x  # finite
    assert 0.0 <= block.x <= 1.0
    assert 0.0 <= block.y <= 1.0
    assert 0.0 <= block.width <= 1.0
    assert 0.0 <= block.height <= 1.0
    assert block.x + block.width <= 1.0 + UNIT_INTERVAL_EPSILON


def test_extraction_block_from_absolute_200_dpi_raster() -> None:
    page = PageDimensions(width=1654.0, height=2339.0)
    block = extraction_block_from_absolute(
        page=1,
        x0=100.0,
        y0=200.0,
        x1=400.0,
        y1=240.0,
        page_size=page,
        text="Line",
    )
    assert block is not None
    assert block.width == (300.0 / 1654.0)
    assert block.height == (40.0 / 2339.0)


def test_rapidocr_blocks_from_ocr_result_normalized() -> None:
    quad = [
        [366.18, 66.77],
        [763.85, 66.77],
        [763.85, 79.0],
        [366.18, 79.0],
    ]
    page = PageDimensions(width=1654.0, height=2339.0)
    _text, blocks = _blocks_from_ocr_result(
        [(quad, "Amount due", 0.99)],
        page=1,
        page_size=page,
    )
    assert len(blocks) == 1
    block = blocks[0]
    assert block.x < 1.0
    assert block.width < 1.0


def test_tesseract_style_word_box_normalized() -> None:
    page = PageDimensions(width=2480.0, height=3508.0)
    block = extraction_block_from_absolute(
        page=2,
        x0=120.0,
        y0=400.0,
        x1=520.0,
        y1=448.0,
        page_size=page,
        text="Wort",
        block_index=7,
    )
    assert block is not None
    assert block.page == 2
    assert block.x == 120.0 / 2480.0


def test_paddle_box_to_block_normalized() -> None:
    box = [[50.0, 20.0], [250.0, 20.0], [250.0, 44.0], [50.0, 44.0]]
    block = _box_to_block(box, "Total", page=1, width=900, height=220, block_index=3)
    assert block is not None
    assert block.x == 50.0 / 900.0
    assert block.y == 20.0 / 220.0


def test_pdf_native_word_boxes_normalized(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("PDF_NATIVE_MIN_CHARS", "0")
    pdf_bytes = b"""%PDF-1.4
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
/Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj
4 0 obj<< /Length 44 >>stream
BT /F1 12 Tf 100 700 Td (Hello native text layer) Tj ET
endstream
endobj
5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000261 00000 n 
0000000354 00000 n 
trailer<< /Size 6 /Root 1 0 R >>
startxref
432
%%EOF"""
    native = try_extract_pdf_native(pdf_bytes)
    assert native is not None
    _text, blocks = native
    assert blocks
    for block in blocks:
        assert block.x <= 1.0 + UNIT_INTERVAL_EPSILON
        assert block.y <= 1.0 + UNIT_INTERVAL_EPSILON
        assert block.width <= 1.0 + UNIT_INTERVAL_EPSILON
        assert block.height <= 1.0 + UNIT_INTERVAL_EPSILON


def test_sanitize_drops_pixel_blocks_keeps_text_path() -> None:
    bad = ExtractionBlock(
        page=1,
        x=366.18,
        y=66.77,
        width=397.67,
        height=12.0,
        text="orphan",
    )
    good = extraction_block_from_normalized(
        page=1,
        x=0.1,
        y=0.2,
        width=0.3,
        height=0.04,
        text="ok",
    )
    assert good is not None
    kept = sanitize_extraction_blocks([bad, good], context="test")
    assert kept == [good]


def test_extraction_blocks_to_models_never_raises_on_bad_blocks() -> None:
    bad = ExtractionBlock(
        page=1,
        x=366.18,
        y=66.77,
        width=397.67,
        height=12.0,
        text="orphan",
    )
    models = extraction_blocks_to_models([bad], context="test")
    assert models == []
