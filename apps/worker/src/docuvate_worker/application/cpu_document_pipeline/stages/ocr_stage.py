# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from docuvate_worker.domain.cpu_pipeline.contracts import (
    OcrStageData,
    PipelineMutableState,
    StageAvailability,
    StageEnvelope,
)
from docuvate_worker.domain.cpu_pipeline.metrics import measure_stage
import os

from docuvate_worker.infrastructure.extractors.paddle_engine import ocr_image_bytes as paddle_ocr_image_bytes
from docuvate_worker.infrastructure.extractors.paddle_engine import ocr_pdf_bytes as paddle_ocr_pdf_bytes
from docuvate_worker.infrastructure.extractors.pdf_native import try_extract_pdf_native
from docuvate_worker.infrastructure.office.extract_born_digital import extract_office_born_digital
from docuvate_worker.infrastructure.office.libreoffice import convert_bytes_to_pdf
from docuvate_worker.infrastructure.office.mimes import (
    is_office_born_digital_mime,
    needs_libreoffice_preview,
)

STAGE_ID = "ocr"


def _ocr_backend() -> str:
    return os.environ.get("DOCUVATE_OCR_BACKEND", "paddle").strip().lower()


def _ocr_pdf(content: bytes) -> tuple[str, list]:
    if _ocr_backend() == "rapidocr":
        from docuvate_worker.infrastructure.extractors.rapidocr_engine import (  # noqa: PLC0415
            ocr_pdf_bytes,
        )

        return ocr_pdf_bytes(content)
    return paddle_ocr_pdf_bytes(content)


def _ocr_image(content: bytes) -> tuple[str, list]:
    if _ocr_backend() == "rapidocr":
        from docuvate_worker.infrastructure.extractors.rapidocr_engine import (  # noqa: PLC0415
            ocr_image_bytes,
        )

        return ocr_image_bytes(content)
    return paddle_ocr_image_bytes(content)


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
            from docuvate_worker.infrastructure.onnx_e5_encoder import (  # noqa: PLC0415
                release_onnx_encoder,
            )

            release_onnx_encoder()
            text, blocks = _ocr_pdf(state.content)
            state.text = text.strip()
            state.blocks = list(blocks or [])
            from docuvate_worker.infrastructure.extractors.paddle_engine import (  # noqa: PLC0415
                release_paddle_ocr,
            )

            release_paddle_ocr()
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
            from docuvate_worker.infrastructure.onnx_e5_encoder import (  # noqa: PLC0415
                release_onnx_encoder,
            )

            release_onnx_encoder()
            text, blocks = _ocr_image(state.content)
            state.text = text.strip()
            state.blocks = list(blocks or [])
            from docuvate_worker.infrastructure.extractors.paddle_engine import (  # noqa: PLC0415
                release_paddle_ocr,
            )

            release_paddle_ocr()
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
