# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Recognition evidence for quarter-turn orientation. Scores come from RapidOCR, not a fake."""

from __future__ import annotations

import io
import os

import numpy as np
import pytest
from PIL import Image, ImageDraw, ImageFont

from docuvate_worker.domain.cpu_pipeline.page_orientation import orient_page_for_ocr
from docuvate_worker.domain.models import ExtractionBlock
from docuvate_worker.infrastructure.extractors.rapidocr_engine import ocr_image_bytes

_FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
# Clockwise content rotation → clockwise turns that put the text upright.
_CORRECTION = {0: 0, 90: 3, 180: 2, 270: 1}


def _font() -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    if os.path.isfile(_FONT):
        return ImageFont.truetype(_FONT, 48)
    return ImageFont.load_default(size=48)


def _upright_page() -> Image.Image:
    image = Image.new("RGB", (900, 1200), "white")
    draw = ImageDraw.Draw(image)
    font = _font()
    draw.text((80, 80), "NORTH 1842", fill="black", font=font)
    draw.text((80, 160), "INVOICE TOTAL", fill="black", font=font)
    return image


def _rotate_cw(image: Image.Image, degrees: int) -> Image.Image:
    if degrees == 0:
        return image
    return image.rotate(-degrees, expand=True)


def _png(image: Image.Image) -> bytes:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def _ink_box(image: Image.Image) -> tuple[float, float, float, float]:
    array = np.asarray(image.convert("RGB"))
    dark = array.mean(axis=2) < 200
    ys, xs = np.nonzero(dark)
    height, width = dark.shape
    x0 = float(xs.min()) / float(width)
    y0 = float(ys.min()) / float(height)
    x1 = float(xs.max() + 1) / float(width)
    y1 = float(ys.max() + 1) / float(height)
    return x0, y0, x1 - x0, y1 - y0


def _overlaps(
    left: tuple[float, float, float, float],
    right: tuple[float, float, float, float],
) -> bool:
    pad = 0.03
    lx, ly, lw, lh = left
    rx, ry, rw, rh = right
    return lx < rx + rw + pad and rx < lx + lw + pad and ly < ry + rh + pad and ry < ly + lh + pad


def _evidence(text: str, blocks: list[ExtractionBlock], turns: tuple[int, ...]) -> str:
    rows = [
        f"{block.text} x={block.x:.3f} y={block.y:.3f} w={block.width:.3f} h={block.height:.3f}"
        for block in blocks
    ]
    return f"turns={turns} text={text!r} blocks={rows}"


@pytest.mark.parametrize("content_cw", [0, 90, 180, 270])
def test_synthetic_page_orientation_matches_ink(content_cw: int) -> None:
    pytest.importorskip("rapidocr_onnxruntime")
    page = _rotate_cw(_upright_page(), content_cw)
    text, blocks, turns = ocr_image_bytes(_png(page))
    evidence = _evidence(text, blocks, turns)
    assert turns == (_CORRECTION[content_cw],), evidence
    assert "1842" in text, evidence
    ink = _ink_box(page)
    assert any(_overlaps(ink, (block.x, block.y, block.width, block.height)) for block in blocks), (
        evidence,
        ink,
    )


def test_blank_page_is_not_rotated() -> None:
    pytest.importorskip("rapidocr_onnxruntime")
    blank = Image.new("RGB", (900, 1200), "white")
    text, blocks, turns = ocr_image_bytes(_png(blank))
    assert turns == (0,)
    assert text == ""
    assert blocks == []


def test_explicit_turn_leaves_upside_down_pixels_unchanged() -> None:
    page = _rotate_cw(_upright_page(), 180)
    array = np.asarray(page)

    def explode(_image: np.ndarray) -> float:
        raise AssertionError("explicit turn must not score the page")

    oriented = orient_page_for_ocr(array, explode, forced_quarter_turns_cw=0)
    assert oriented.quarter_turns_cw == 0
    assert np.array_equal(oriented.image, array)
