# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import io
import logging
import os
from typing import Any, Protocol, cast

import numpy as np
from pdf2image import convert_from_bytes
from PIL import Image

from docuvate_worker.domain.models import ExtractionBlock
from docuvate_worker.infrastructure.extractors.paddle_errors import map_paddle_exception

logger = logging.getLogger(__name__)

_ocr_instance: Any | None = None


def _configure_paddle_env() -> None:
    """CPU-only inference flags before any paddle import (avoids MKLDNN batch_norm cast bugs)."""
    os.environ.setdefault("FLAGS_use_mkldnn", "0")
    os.environ.setdefault("CPU_NUM", "1")
    os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")


def _paddle_lang() -> str:
    return os.environ.get("PADDLE_OCR_LANG", "german")


class _PaddleOcr(Protocol):
    def ocr(self, *args: Any, **kwargs: Any) -> list[object]: ...


def _get_paddle_ocr() -> _PaddleOcr:
    global _ocr_instance  # noqa: PLW0603
    if _ocr_instance is not None:
        return cast(_PaddleOcr, cast(object, _ocr_instance))

    _configure_paddle_env()

    from paddleocr import PaddleOCR  # noqa: PLC0415

    logger.info(
        "Initializing PaddleOCR (PP-OCRv4 mobile, lang=%s). "
        "First run downloads models to ~/.paddleocr — can take several minutes on CPU.",
        _paddle_lang(),
    )
    _ocr_instance = PaddleOCR(
        use_angle_cls=False,
        lang=_paddle_lang(),
        use_gpu=False,
        show_log=False,
        ocr_version="PP-OCRv4",
        enable_mkldnn=False,
        use_tensorrt=False,
    )
    return cast(_PaddleOcr, cast(object, _ocr_instance))


def prewarm_paddle_models() -> None:
    """Download det/rec weights and run one tiny inference (Docker build / startup)."""
    _configure_paddle_env()
    ocr = _get_paddle_ocr()
    probe = np.zeros((32, 128, 3), dtype=np.uint8)
    try:
        ocr.ocr(probe, cls=False)
    except Exception as exc:
        raise RuntimeError(map_paddle_exception(exc)) from exc
    logger.info("PaddleOCR prewarm complete (latin det + rec on CPU).")


def _box_to_block(
    box: list[list[float]],
    text: str,
    page: int,
    width: int,
    height: int,
    block_index: int,
) -> ExtractionBlock:
    xs = [float(p[0]) for p in box]
    ys = [float(p[1]) for p in box]
    left = min(xs)
    top = min(ys)
    w = max(xs) - left
    h = max(ys) - top
    return ExtractionBlock(
        page=page,
        x=left / width if width else 0.0,
        y=top / height if height else 0.0,
        width=w / width if width else 0.0,
        height=h / height if height else 0.0,
        text=text,
        block_index=block_index,
    )


def _ocr_pil_image(
    image: Image.Image, page: int, block_offset: int
) -> tuple[str, list[ExtractionBlock]]:
    try:
        ocr = _get_paddle_ocr()
        rgb = image.convert("RGB")
        width, height = rgb.size
        arr = np.array(rgb)
        lines = ocr.ocr(arr, cls=False) or []
    except Exception as exc:
        raise RuntimeError(map_paddle_exception(exc)) from exc

    page_lines: list[str] = []
    blocks: list[ExtractionBlock] = []
    idx = block_offset

    if lines and isinstance(lines[0], list):
        for entry in lines[0]:
            if not entry or len(entry) < 2:  # noqa: PLR2004
                continue
            box, rec = entry[0], entry[1]
            if not rec:
                continue
            text = str(rec[0]).strip()
            if not text:
                continue
            page_lines.append(text)
            blocks.append(_box_to_block(box, text, page, width, height, idx))
            idx += 1

    return "\n".join(page_lines), blocks


def ocr_image_bytes(content: bytes) -> tuple[str, list[ExtractionBlock]]:
    image = Image.open(io.BytesIO(content))
    text, blocks = _ocr_pil_image(image, page=1, block_offset=0)
    return text.strip(), blocks


def ocr_pdf_bytes(
    content: bytes, *, max_pages: int | None = None
) -> tuple[str, list[ExtractionBlock]]:
    logger.info("Rasterizing PDF for PaddleOCR (poppler); this may take a while on large files.")
    if max_pages and max_pages > 0:
        images = convert_from_bytes(content, last_page=max_pages)
    else:
        images = convert_from_bytes(content)
    if not images:
        return "", []

    page_texts: list[str] = []
    all_blocks: list[ExtractionBlock] = []
    block_index = 0

    for page_num, image in enumerate(images, start=1):
        page_text, blocks = _ocr_pil_image(image, page=page_num, block_offset=block_index)
        if page_text:
            page_texts.append(page_text)
        all_blocks.extend(blocks)
        block_index += len(blocks)

    return "\n\n".join(page_texts).strip(), all_blocks
