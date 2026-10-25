# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import io
import logging
import os
from dataclasses import dataclass, field
from typing import Any

import numpy as np
from PIL import Image

from docuvate_worker.domain.models import ExtractionBlock
from docuvate_worker.infrastructure.extractors.pdf_raster import iter_pdf_page_images
from docuvate_worker.infrastructure.extractors.rapidocr_loader import build_rapidocr_engine
from docuvate_worker.infrastructure.extractors.rapidocr_protocol import RapidOcrEngine
from docuvate_worker.infrastructure.ml.docai.paths import docai_model_dir
from docuvate_worker.infrastructure.onnx_runtime_env import configure_onnx_runtime_env
from docuvate_worker.infrastructure.worker_memory_hygiene import reclaim_python_heap

logger = logging.getLogger(__name__)

RAPIDOCR_BUNDLE_ID = "rapidocr:docai-v0.3-en-latin-rec"
_REC_BATCH_NUM = 3


@dataclass
class _RapidOcrHolder:
    instance: RapidOcrEngine | None = field(default=None)


_rapidocr_holder = _RapidOcrHolder()


def release_rapidocr() -> None:
    _rapidocr_holder.instance = None


def _get_rapidocr() -> RapidOcrEngine:
    if _rapidocr_holder.instance is not None:
        return _rapidocr_holder.instance
    configure_onnx_runtime_env()
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
    _rapidocr_holder.instance = build_rapidocr_engine(**kwargs)
    if not ocr_cfg_path.is_file():
        logger.warning("DocAI config.json missing at %s", ocr_cfg_path)
    return _rapidocr_holder.instance


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
    image = Image.open(io.BytesIO(content)).convert("RGB")
    array = np.asarray(image)
    ocr = _get_rapidocr()
    result, _ = ocr(array, use_cls=False)
    return _blocks_from_ocr_result(result, page=1, scale_x=1.0, scale_y=1.0)


def _ocr_pdf_dpi() -> int:
    raw = os.environ.get("DOCUVATE_OCR_PDF_DPI", "200").strip()
    return int(raw) if raw.isdigit() and int(raw) > 0 else 200


def ocr_pdf_bytes(
    content: bytes, *, max_pages: int | None = None
) -> tuple[str, list[ExtractionBlock]]:
    ocr = _get_rapidocr()
    all_lines: list[str] = []
    blocks: list[ExtractionBlock] = []
    dpi = _ocr_pdf_dpi()
    try:
        for page_index, page in iter_pdf_page_images(
            content, dpi=dpi, max_pages=max_pages
        ):
            try:
                array = np.asarray(page.convert("RGB"))
                result, _ = ocr(array, use_cls=False)
                text, page_blocks = _blocks_from_ocr_result(
                    result,
                    page=page_index,
                    scale_x=1.0,
                    scale_y=1.0,
                )
                if text.strip():
                    all_lines.append(text)
                blocks.extend(page_blocks)
            finally:
                page.close()
                reclaim_python_heap()
    finally:
        reclaim_python_heap()
    return "\n\n".join(all_lines).strip(), blocks


def prewarm_rapidocr_models() -> None:
    ocr = _get_rapidocr()
    probe = np.zeros((32, 128, 3), dtype=np.uint8)
    ocr(probe, use_cls=False)
