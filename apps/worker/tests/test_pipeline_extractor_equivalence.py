# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import io
import logging
from collections.abc import Callable

import pytest
from PIL import Image, ImageDraw, ImageFont

from docuvate_worker.domain.models import ExtractionBlock, ExtractedField
from docuvate_worker.infrastructure.extractors.baseline_pipeline import extract_baseline_pipeline
from docuvate_worker.infrastructure.extractors.pipeline import PipelineExtractor
from tests.synthetic_layout_pdfs import delivery_note_table_pdf
from tests.synthetic_scan_pdfs import scanned_image_only_pdf

logger = logging.getLogger(__name__)


def _paddle_ocr_usable() -> bool:
    try:
        from docuvate_worker.infrastructure.extractors.paddle_engine import (  # noqa: PLC0415
            _get_paddle_ocr,
        )

        _get_paddle_ocr()
    except Exception:
        return False
    return True


def _require_paddle_ocr() -> None:
    if not _paddle_ocr_usable():
        pytest.skip("PaddleOCR cannot be imported or initialised in this environment")


def _png_ocr_fixture_bytes() -> bytes:
    w_px, h_px = 900, 220
    img = Image.new("RGB", (w_px, h_px), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", size=48)
    except OSError:
        font = ImageFont.load_default()
    draw.text((40, 80), "WAREHOUSE SHIPMENT DOC 47", fill=(0, 0, 0), font=font)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


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


def _assert_equivalent(
    content: bytes,
    mime_type: str,
    *,
    require_nonempty_blocks: bool,
    case_id: str,
) -> None:
    baseline = extract_baseline_pipeline(content, mime_type)
    if require_nonempty_blocks:
        assert baseline.blocks, f"{case_id}: baseline OCR must produce blocks"
    current = PipelineExtractor().extract(content, mime_type)
    assert current.text == baseline.text, case_id
    assert _fields_equal(current.field_suggestions, baseline.field_suggestions), case_id
    assert _blocks_equal(current.blocks, baseline.blocks), case_id
    assert current.cpu_pipeline is not None, case_id
    assert current.cpu_pipeline.taco is not None, case_id
    logger.info("pr47_equivalence_passed case=%s blocks=%d", case_id, len(baseline.blocks or []))


@pytest.mark.parametrize(
    ("content_factory", "mime_type", "require_ocr", "require_nonempty_blocks"),
    [
        (delivery_note_table_pdf, "application/pdf", False, False),
        (scanned_image_only_pdf, "application/pdf", True, True),
        (_png_ocr_fixture_bytes, "image/png", True, True),
    ],
    ids=["native_pdf", "scanned_image_only", "png_image"],
)
def test_pipeline_extractor_matches_baseline(
    content_factory: Callable[[], bytes],
    mime_type: str,
    require_ocr: bool,
    require_nonempty_blocks: bool,
    request: pytest.FixtureRequest,
) -> None:
    case_id = request.node.callspec.id if request.node.callspec else "unknown"
    if require_ocr:
        _require_paddle_ocr()
    content = content_factory()
    _assert_equivalent(
        content,
        mime_type,
        require_nonempty_blocks=require_nonempty_blocks,
        case_id=case_id,
    )
