# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from typing import Any

import numpy as np

from docuvate_worker.domain.cpu_pipeline.page_orientation import (
    map_norm_box_to_unrotated,
    orient_page_for_ocr,
)
from docuvate_worker.domain.extraction_geometry import (
    PageDimensions,
    extraction_block_from_absolute,
)
from docuvate_worker.domain.models import ExtractionBlock
from docuvate_worker.infrastructure.extract_memory.bounded_raster import open_image_bounded
from docuvate_worker.infrastructure.extract_memory.raster_settings import (
    raster_max_pixels_per_page,
)
from docuvate_worker.infrastructure.extractors.pdf_raster import iter_pdf_page_images
from docuvate_worker.infrastructure.extractors.rapidocr_loader import build_rapidocr_engine
from docuvate_worker.infrastructure.extractors.rapidocr_protocol import OcrImage, RapidOcrEngine
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
    page_size: PageDimensions,
    block_offset: int = 0,
    quarter_turns_cw: int = 0,
    source_page_size: PageDimensions | None = None,
) -> tuple[str, list[ExtractionBlock]]:
    lines: list[str] = []
    blocks: list[ExtractionBlock] = []
    block_index = block_offset
    unrotated_size = source_page_size or page_size
    for quad, text, _conf in ocr_result or []:
        cleaned = text.strip()
        if not cleaned:
            continue
        xs = [point[0] for point in quad]
        ys = [point[1] for point in quad]
        block = extraction_block_from_absolute(
            page=page,
            x0=min(xs),
            y0=min(ys),
            x1=max(xs),
            y1=max(ys),
            page_size=page_size,
            text=cleaned,
            block_index=block_index,
        )
        if block is None:
            continue
        if quarter_turns_cw:
            nx, ny, nw, nh = map_norm_box_to_unrotated(
                block.x, block.y, block.width, block.height, quarter_turns_cw
            )
            block = ExtractionBlock(
                page=block.page,
                x=nx,
                y=ny,
                width=nw,
                height=nh,
                text=block.text,
                block_index=block.block_index,
            )
            # Clamp against the source (unrotated) page; values already normalized.
            _ = unrotated_size
        lines.append(cleaned)
        blocks.append(block)
        block_index += 1
    return "\n".join(lines), blocks


def _orientation_enabled() -> bool:
    raw = os.environ.get("DOCUVATE_OCR_ORIENT", "1").strip().lower()
    return raw not in {"0", "false", "no", "off"}


def _ocr_orientation_score(ocr: RapidOcrEngine, array: OcrImage) -> float:
    # The angle classifier rewrites crops, so every quarter turn looks readable and
    # the highest score is no longer the upright page. Score the recognizer as-is.
    result, _ = ocr(array, use_cls=False)
    if not result:
        return 0.0
    score = 0.0
    for _quad, text, conf in result:
        cleaned = (text or "").strip()
        if not cleaned:
            continue
        weight = max(1, len(cleaned))
        score += float(conf) * weight
    return score


def _ocr_oriented_page(
    ocr: RapidOcrEngine,
    array: OcrImage,
    *,
    page: int,
    block_offset: int,
    forced_quarter_turns_cw: int | None = None,
) -> tuple[str, list[ExtractionBlock], int]:
    source_h, source_w = array.shape[:2]
    source_size = PageDimensions(width=float(source_w), height=float(source_h))
    if forced_quarter_turns_cw is not None:
        oriented = orient_page_for_ocr(array, forced_quarter_turns_cw=forced_quarter_turns_cw)
    elif _orientation_enabled():
        oriented = orient_page_for_ocr(array, lambda img: _ocr_orientation_score(ocr, img))
    else:
        oriented = orient_page_for_ocr(array, forced_quarter_turns_cw=0)
    page_h, page_w = oriented.image.shape[:2]
    page_size = PageDimensions(width=float(page_w), height=float(page_h))
    # The angle classifier is not part of the committed FUNSD measurement. Orientation
    # is chosen above; the recognizer then reads the oriented page as-is.
    result, _ = ocr(oriented.image, use_cls=False)
    text, blocks = _blocks_from_ocr_result(
        result,
        page=page,
        page_size=page_size,
        block_offset=block_offset,
        quarter_turns_cw=oriented.quarter_turns_cw,
        source_page_size=source_size,
    )
    return text, blocks, oriented.quarter_turns_cw


def ocr_image_bytes(
    content: bytes,
    *,
    forced_quarter_turns_cw: int | None = None,
) -> tuple[str, list[ExtractionBlock], tuple[int, ...]]:
    """Recognize one image. ``forced_quarter_turns_cw`` is a persisted manual turn."""
    with open_image_bounded(content, raster_max_pixels_per_page()) as decoded:
        array = np.asarray(decoded.convert("RGB"))
    ocr = _get_rapidocr()
    text, blocks, turns = _ocr_oriented_page(
        ocr,
        array,
        page=1,
        block_offset=0,
        forced_quarter_turns_cw=forced_quarter_turns_cw,
    )
    return text, blocks, (turns,)


def _ocr_pdf_dpi() -> int:
    raw = os.environ.get("DOCUVATE_OCR_PDF_DPI", "200").strip()
    return int(raw) if raw.isdigit() and int(raw) > 0 else 200


def ocr_pdf_bytes(
    content: bytes, *, max_pages: int | None = None
) -> tuple[str, list[ExtractionBlock], tuple[int, ...]]:
    ocr = _get_rapidocr()
    all_lines: list[str] = []
    blocks: list[ExtractionBlock] = []
    page_turns: list[int] = []
    block_index = 0
    dpi = _ocr_pdf_dpi()
    try:
        for page_index, page in iter_pdf_page_images(content, dpi=dpi, max_pages=max_pages):
            try:
                array = np.asarray(page.convert("RGB"))
                text, page_blocks, turns = _ocr_oriented_page(
                    ocr, array, page=page_index, block_offset=block_index
                )
                page_turns.append(turns)
                if text.strip():
                    all_lines.append(text)
                blocks.extend(page_blocks)
                block_index += len(page_blocks)
            finally:
                page.close()
                reclaim_python_heap()
    finally:
        reclaim_python_heap()
    return "\n\n".join(all_lines).strip(), blocks, tuple(page_turns)


def prewarm_rapidocr_models() -> None:
    ocr = _get_rapidocr()
    probe = np.zeros((32, 128, 3), dtype=np.uint8)
    ocr(probe, use_cls=False)
