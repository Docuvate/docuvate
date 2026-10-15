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
from docuvate_worker.infrastructure.extractors.paddle_engine import ocr_image_bytes, ocr_pdf_bytes
from docuvate_worker.infrastructure.extractors.pdf_native import try_extract_pdf_native
from docuvate_worker.infrastructure.office.extract_born_digital import extract_office_born_digital
from docuvate_worker.infrastructure.office.libreoffice import convert_bytes_to_pdf
from docuvate_worker.infrastructure.office.mimes import (
    is_office_born_digital_mime,
    needs_libreoffice_preview,
)

STAGE_ID = "ocr"


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
            text, blocks = ocr_pdf_bytes(state.content)
            state.text = text.strip()
            state.blocks = list(blocks or [])
            return (
                OcrStageData(
                    text=state.text,
                    blocks=tuple(state.blocks),
                    source="paddle_ocr",
                ),
                StageAvailability.OK,
                None,
            )
        if state.mime_type.startswith("image/"):
            text, blocks = ocr_image_bytes(state.content)
            state.text = text.strip()
            state.blocks = list(blocks or [])
            return (
                OcrStageData(
                    text=state.text,
                    blocks=tuple(state.blocks),
                    source="paddle_ocr",
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
