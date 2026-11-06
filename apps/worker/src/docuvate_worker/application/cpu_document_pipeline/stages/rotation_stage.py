# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import logging

from docuvate_worker.domain.cpu_pipeline.contracts import (
    PipelineMutableState,
    RotationStageData,
    StageAvailability,
    StageEnvelope,
)
from docuvate_worker.domain.cpu_pipeline.metrics import measure_stage
from docuvate_worker.domain.cpu_pipeline.page_rotation import page_rotations_deg
from docuvate_worker.domain.layout_ir import LayoutIrDocument

STAGE_ID = "rotation_correction"

logger = logging.getLogger(__name__)


def _pdf_layout(state: PipelineMutableState) -> LayoutIrDocument | None:
    if state.mime_type != "application/pdf" or not state.blocks:
        return None
    from docuvate_worker.infrastructure.layout.layout_pdf_cache import (  # noqa: PLC0415
        get_or_extract_layout_pdf,
    )

    try:
        return get_or_extract_layout_pdf(state)
    except Exception:
        logger.warning("rotation_stage: PDF layout extraction failed", exc_info=True)
        return None


def run_rotation_stage(state: PipelineMutableState) -> StageEnvelope[RotationStageData]:
    """Measure the dominant text rotation of every PDF page.

    Only PDF text layers carry glyph orientation; OCR blocks are already upright, so other
    inputs report no page measurements instead of a fabricated 0°.
    """

    def _run() -> RotationStageData:
        # Prefer orientation already applied before OCR (scanned pages). Fall back to
        # measuring dominant glyph rotation on native PDF text layers.
        if state.page_quarter_turns:
            rotations = tuple(float(turns * 90) for turns in state.page_quarter_turns)
        else:
            layout = _pdf_layout(state)
            rotations = page_rotations_deg(layout.pages) if layout is not None else ()
        return RotationStageData(
            blocks=tuple(state.blocks),
            page_rotations_deg=rotations,
            correction_applied=any(rotation != 0.0 for rotation in rotations),
        )

    data, metrics = measure_stage(_run)
    return StageEnvelope(
        stage_id=STAGE_ID,
        availability=StageAvailability.OK,
        metrics=metrics,
        data=data,
        detail=None,
    )
