# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import os

from docuvate_worker.domain.cpu_pipeline.contracts import (
    OcrStageData,
    PipelineMutableState,
    StageAvailability,
    StageEnvelope,
)
from docuvate_worker.domain.cpu_pipeline.metrics import measure_stage
from docuvate_worker.domain.models import ExtractionBlock
from docuvate_worker.infrastructure.extractors.paddle_engine import (
    ocr_image_bytes as paddle_ocr_image_bytes,
)
from docuvate_worker.infrastructure.extractors.paddle_engine import (
    ocr_pdf_bytes as paddle_ocr_pdf_bytes,
)
from docuvate_worker.infrastructure.extractors.paddle_engine import (
    release_paddle_ocr,
)
from docuvate_worker.infrastructure.extractors.pdf_chunk_extract import (
    append_chunk_ocr_part,
    iter_pdf_page_chunk_specs,
    load_cached_chunk_result,
    pdf_chunk_page_size,
    pdf_page_count,
    persist_chunk_result,
    shift_blocks_page_offset,
    should_chunk_scanned_pdf,
    slice_pdf_bytes,
)
from docuvate_worker.infrastructure.extractors.pdf_native import try_extract_pdf_native
from docuvate_worker.infrastructure.extractors.rapidocr_engine import (
    ocr_image_bytes as rapidocr_ocr_image_bytes,
)
from docuvate_worker.infrastructure.extractors.rapidocr_engine import (
    ocr_pdf_bytes as rapidocr_ocr_pdf_bytes,
)
from docuvate_worker.infrastructure.extractors.rapidocr_engine import (
    release_rapidocr,
)
from docuvate_worker.infrastructure.office.extract_born_digital import extract_office_born_digital
from docuvate_worker.infrastructure.office.libreoffice import convert_bytes_to_pdf
from docuvate_worker.infrastructure.office.mimes import (
    is_office_born_digital_mime,
    needs_libreoffice_preview,
)
from docuvate_worker.infrastructure.onnx_e5_encoder import release_onnx_encoder
from docuvate_worker.infrastructure.worker_memory_hygiene import reclaim_python_heap

STAGE_ID = "ocr"


def _ocr_backend() -> str:
    return os.environ.get("DOCUVATE_OCR_BACKEND", "paddle").strip().lower()


def _ocr_pdf(content: bytes) -> tuple[str, list[ExtractionBlock]]:
    if _ocr_backend() == "rapidocr":
        return rapidocr_ocr_pdf_bytes(content)
    return paddle_ocr_pdf_bytes(content)


def _ocr_image(content: bytes) -> tuple[str, list[ExtractionBlock]]:
    if _ocr_backend() == "rapidocr":
        return rapidocr_ocr_image_bytes(content)
    return paddle_ocr_image_bytes(content)


def _release_ocr_backends() -> None:
    release_paddle_ocr()
    if _ocr_backend() == "rapidocr":
        release_rapidocr()


def _ocr_pdf_in_page_chunks(content: bytes) -> tuple[str, list[ExtractionBlock]]:
    pages = pdf_page_count(content)
    chunk_pages = pdf_chunk_page_size()
    specs = iter_pdf_page_chunk_specs(pages, chunk_pages)
    merged_texts: list[str] = []
    merged_blocks: list[ExtractionBlock] = []
    block_index = 0
    for spec in specs:
        cached = load_cached_chunk_result(content, spec)
        if cached is not None:
            text, blocks = cached
            shifted = shift_blocks_page_offset(blocks, spec.page_offset)
            block_index = append_chunk_ocr_part(
                merged_texts,
                merged_blocks,
                text,
                shifted,
                block_index_start=block_index,
            )
            continue
        sub_pdf = slice_pdf_bytes(content, spec.first_page, spec.last_page)
        release_onnx_encoder()
        try:
            text, blocks = _ocr_pdf(sub_pdf)
        finally:
            _release_ocr_backends()
            reclaim_python_heap()
        persist_chunk_result(content, spec, text, blocks)
        shifted = shift_blocks_page_offset(blocks, spec.page_offset)
        block_index = append_chunk_ocr_part(
            merged_texts,
            merged_blocks,
            text,
            shifted,
            block_index_start=block_index,
        )
        del sub_pdf, text, blocks, shifted
        reclaim_python_heap()
    return "\n\n".join(merged_texts).strip(), merged_blocks


def run_ocr_stage(state: PipelineMutableState) -> StageEnvelope[OcrStageData]:
    def _run() -> tuple[OcrStageData, StageAvailability, str | None]:
        if state.mime_type == "application/pdf":
            native = try_extract_pdf_native(state.content)
            if native is not None:
                text, blocks = native
                state.text = text
                state.blocks = list(blocks or [])
                return (
                    OcrStageData(
                        text=text,
                        blocks=tuple(state.blocks),
                        source="pdf_text_layer",
                    ),
                    StageAvailability.OK,
                    None,
                )
            release_onnx_encoder()
            if should_chunk_scanned_pdf(state.content, state.mime_type, requires_ocr=True):
                text, blocks = _ocr_pdf_in_page_chunks(state.content)
            else:
                text, blocks = _ocr_pdf(state.content)
            state.text = text.strip()
            state.blocks = list(blocks or [])
            _release_ocr_backends()
            return (
                OcrStageData(
                    text=state.text,
                    blocks=tuple(state.blocks),
                    source="rapidocr" if _ocr_backend() == "rapidocr" else "paddle_ocr",
                ),
                StageAvailability.OK,
                None,
            )
        if state.mime_type.startswith("image/"):
            release_onnx_encoder()
            text, blocks = _ocr_image(state.content)
            state.text = text.strip()
            state.blocks = list(blocks or [])
            _release_ocr_backends()
            return (
                OcrStageData(
                    text=state.text,
                    blocks=tuple(state.blocks),
                    source="rapidocr" if _ocr_backend() == "rapidocr" else "paddle_ocr",
                ),
                StageAvailability.OK,
                None,
            )
        if is_office_born_digital_mime(state.mime_type):
            office = extract_office_born_digital(state.content, state.mime_type)
            if office is not None and office.text.strip():
                state.text = office.text.strip()
                state.blocks = list(office.blocks)
                if office.layout_ir is not None:
                    state.prebuilt_layout_ir = office.layout_ir
                if needs_libreoffice_preview(state.mime_type):
                    preview = convert_bytes_to_pdf(state.content, state.mime_type)
                    if preview is not None:
                        state.preview_pdf = preview
                return (
                    OcrStageData(
                        text=state.text,
                        blocks=tuple(state.blocks),
                        source=office.source,
                    ),
                    StageAvailability.OK,
                    None,
                )
            return (
                OcrStageData(text="", blocks=(), source="office_extract_failed"),
                StageAvailability.NOT_AVAILABLE,
                f"office extraction failed for {state.mime_type!r}",
            )
        return (
            OcrStageData(text="", blocks=(), source="unsupported_mime"),
            StageAvailability.NOT_AVAILABLE,
            f"unsupported mime type {state.mime_type!r}",
        )

    (data, availability, detail), metrics = measure_stage(_run)
    return StageEnvelope(
        stage_id=STAGE_ID,
        availability=availability,
        metrics=metrics,
        data=data,
        detail=detail,
    )
