# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import logging
import os
from typing import Any, cast

import numpy as np
from pdf2image import convert_from_bytes
from PIL import Image

from docuvate_worker.domain.models import ExtractionBlock
from docuvate_worker.infrastructure.ml.docai.paths import docai_model_dir

logger = logging.getLogger(__name__)

RAPIDOCR_BUNDLE_ID = "rapidocr:docai-v0.3-en-latin-rec"
_REC_BATCH_NUM = 3

_ocr_instance: Any | None = None


def release_rapidocr() -> None:
    global _ocr_instance  # noqa: PLW0603
    _ocr_instance = None


def _get_rapidocr() -> Any:
    global _ocr_instance  # noqa: PLW0603
    if _ocr_instance is not None:
        return _ocr_instance
    from rapidocr_onnxruntime import RapidOCR  # noqa: PLC0415

    model_dir = docai_model_dir()
    ocr_cfg_path = model_dir / "config.json"
    rec_path = model_dir / "ocr" / "en_PP-OCRv5_rec_mobile.onnx"
    threads = int(os.environ.get("DOCUVATE_DOCAI_THREADS", "2"))
    kwargs: dict[str, Any] = {
        "intra_op_num_threads": threads,
        "inter_op_num_threads": 1,
        "rec_batch_num": _REC_BATCH_NUM,
    }
    if rec_path.is_file():
        kwargs["rec_model_path"] = str(rec_path)
    logger.info(
        "Initializing RapidOCR DocAI v0.3 (rec_batch_num=%s, bundle=%s)",
        _REC_BATCH_NUM,
        RAPIDOCR_BUNDLE_ID,
    )
    _ocr_instance = RapidOCR(**kwargs)
    if not ocr_cfg_path.is_file():
        logger.warning("DocAI config.json missing at %s", ocr_cfg_path)
    return _ocr_instance


def _blocks_from_ocr_result(
    ocr_result: list[tuple[list[list[float]], str, float]] | None,
    *,
    page: int,
    scale_x: float,
    scale_y: float,
) -> tuple[str, list[ExtractionBlock]]:
    lines: list[str] = []
    blocks: list[ExtractionBlock] = []
    for quad, text, _conf in ocr_result or []:
        cleaned = text.strip()
        if not cleaned:
            continue
        xs = [point[0] for point in quad]
        ys = [point[1] for point in quad]
        x0 = min(xs) * scale_x
        y0 = min(ys) * scale_y
        x1 = max(xs) * scale_x
        y1 = max(ys) * scale_y
        lines.append(cleaned)
        blocks.append(
            ExtractionBlock(
                text=cleaned,
                page=page,
                x=x0,
                y=y0,
                width=max(x1 - x0, 1.0),
                height=max(y1 - y0, 1.0),
            )
        )
    return "\n".join(lines), blocks


def ocr_image_bytes(content: bytes) -> tuple[str, list[ExtractionBlock]]:
    image = Image.open(__import__("io").BytesIO(content)).convert("RGB")
    array = np.asarray(image)
    height, width = array.shape[:2]
    ocr = _get_rapidocr()
    result, _ = ocr(array, use_cls=False)
    return _blocks_from_ocr_result(cast(list, result), page=1, scale_x=1.0, scale_y=1.0)


def ocr_pdf_bytes(content: bytes) -> tuple[str, list[ExtractionBlock]]:
    pages = convert_from_bytes(content, dpi=200)
    ocr = _get_rapidocr()
    all_lines: list[str] = []
    blocks: list[ExtractionBlock] = []
    for page_index, page in enumerate(pages, start=1):
        array = np.asarray(page.convert("RGB"))
        page_h, page_w = array.shape[:2]
        result, _ = ocr(array, use_cls=False)
        text, page_blocks = _blocks_from_ocr_result(
            cast(list, result),
            page=page_index,
            scale_x=1.0,
            scale_y=1.0,
        )
        if text.strip():
            all_lines.append(text)
        blocks.extend(page_blocks)
        del array
    return "\n\n".join(all_lines).strip(), blocks


def prewarm_rapidocr_models() -> None:
    ocr = _get_rapidocr()
    probe = np.zeros((32, 128, 3), dtype=np.uint8)
    ocr(probe, use_cls=False)
