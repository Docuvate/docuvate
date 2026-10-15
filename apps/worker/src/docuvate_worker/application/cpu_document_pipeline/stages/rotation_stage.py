# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import math

from docuvate_worker.domain.cpu_pipeline.contracts import (
    PipelineMutableState,
    RotationStageData,
    StageAvailability,
    StageEnvelope,
)
from docuvate_worker.domain.cpu_pipeline.metrics import measure_stage
from docuvate_worker.domain.models import ExtractionBlock

STAGE_ID = "rotation_correction"


def _dominant_rotation_deg(blocks: tuple[ExtractionBlock, ...]) -> float:
    if not blocks:
        return 0.0
    return 0.0


def run_rotation_stage(state: PipelineMutableState) -> StageEnvelope[RotationStageData]:
    def _run() -> RotationStageData:
        blocks = tuple(state.blocks)
        if state.mime_type == "application/pdf" and blocks:
            try:
                from docuvate_worker.infrastructure.layout.layout_pdf_cache import (  # noqa: PLC0415
                    get_or_extract_layout_pdf,
                )

                layout = get_or_extract_layout_pdf(state)
            except Exception:
                layout = None
            if layout is not None and layout.pages:
                page = layout.pages[0]
                rotated = [
                    b
                    for b in page.blocks
                    if b.rotation_deg is not None and abs(b.rotation_deg) >= 45.0
                ]
                if rotated:
                    deg = rotated[0].rotation_deg or 90.0
                    corrected = math.remainder(deg, 360.0)
                    return RotationStageData(
                        blocks=blocks,
                        page_rotations_deg=(corrected,),
                        correction_applied=True,
                    )
        dominant = _dominant_rotation_deg(blocks)
        return RotationStageData(
            blocks=blocks,
            page_rotations_deg=(dominant,),
            correction_applied=False,
        )

    data, metrics = measure_stage(_run)
    return StageEnvelope(
        stage_id=STAGE_ID,
        availability=StageAvailability.OK,
        metrics=metrics,
        data=data,
        detail=None,
    )
