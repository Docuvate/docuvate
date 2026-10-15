# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from docuvate_worker.domain.cpu_pipeline.contracts import (
    PipelineMutableState,
    RepresentationStageData,
    StageAvailability,
    StageEnvelope,
)
from docuvate_worker.domain.cpu_pipeline.metrics import measure_stage
from docuvate_worker.domain.representation.encode import encode_units
from docuvate_worker.domain.representation.units import build_representation_units

STAGE_ID = "document_representation"


def run_representation_stage(state: PipelineMutableState) -> StageEnvelope[RepresentationStageData]:
    def _run() -> tuple[RepresentationStageData, StageAvailability, str | None]:
        if not state.text.strip():
            return (
                RepresentationStageData(representation=None),
                StageAvailability.UNCERTAIN,
                "no text to encode",
            )
        try:
            units = build_representation_units(
                text=state.text,
                blocks=tuple(state.blocks),
                content=state.content,
                mime_type=state.mime_type,
                luna=state.luna_data,
                taco=state.taco_data,
                layout_pdf=state.cached_layout_pdf,
            )
            representation = encode_units(units)
            from docuvate_worker.infrastructure.onnx_e5_encoder import (  # noqa: PLC0415
                release_onnx_encoder,
            )

            release_onnx_encoder()
            state.document_representation = representation
            return (
                RepresentationStageData(representation=representation),
                StageAvailability.OK,
                None,
            )
        except Exception as exc:
            return (
                RepresentationStageData(representation=None),
                StageAvailability.NOT_AVAILABLE,
                f"representation encode failed: {type(exc).__name__}",
            )

    (data, availability, detail), metrics = measure_stage(_run)
    return StageEnvelope(
        stage_id=STAGE_ID,
        availability=availability,
        metrics=metrics,
        data=data,
        detail=detail,
    )
