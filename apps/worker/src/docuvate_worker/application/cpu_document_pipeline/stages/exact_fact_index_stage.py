# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from docuvate_worker.domain.cpu_pipeline.contracts import (
    ExactFactIndexStageData,
    PipelineMutableState,
    StageAvailability,
    StageEnvelope,
)
from docuvate_worker.domain.cpu_pipeline.metrics import measure_stage
from docuvate_worker.domain.exact_fact_index.build import build_exact_fact_index

STAGE_ID = "exact_fact_index"


def run_exact_fact_index_stage(
    state: PipelineMutableState,
    *,
    enabled: bool,
) -> StageEnvelope[ExactFactIndexStageData]:
    def _run() -> tuple[ExactFactIndexStageData, StageAvailability, str | None]:
        if not enabled:
            return (
                ExactFactIndexStageData(facts=(), wall_time_ms=0.0),
                StageAvailability.NOT_AVAILABLE,
                "exact fact index disabled",
            )
        if not state.text.strip():
            return (
                ExactFactIndexStageData(facts=(), wall_time_ms=0.0),
                StageAvailability.NOT_AVAILABLE,
                "no text for fact index",
            )
        built = build_exact_fact_index(
            text=state.text,
            blocks=tuple(state.blocks),
            content=state.content,
            mime_type=state.mime_type,
            taco=state.taco_data,
            layout_pdf=state.cached_layout_pdf,
        )
        availability = StageAvailability.OK if built.facts else StageAvailability.UNCERTAIN
        detail = f"{len(built.facts)} fact(s) indexed" if built.facts else "no facts extracted"
        return (
            ExactFactIndexStageData(facts=built.facts, wall_time_ms=built.wall_time_ms),
            availability,
            detail,
        )

    (data, availability, detail), metrics = measure_stage(_run)
    return StageEnvelope(
        stage_id=STAGE_ID,
        availability=availability,
        metrics=metrics,
        data=data,
        detail=detail,
    )
