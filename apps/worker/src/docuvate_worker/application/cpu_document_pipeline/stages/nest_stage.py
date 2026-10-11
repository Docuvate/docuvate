# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import os

from docuvate_worker.domain.cpu_pipeline.contracts import (
    NestStageData,
    PipelineMutableState,
    StageAvailability,
    StageEnvelope,
)
from docuvate_worker.domain.cpu_pipeline.metrics import measure_stage

STAGE_ID = "nest_classification"


def _nest_state_configured() -> bool:
    return bool(os.environ.get("NEST_EMBEDDING_STATE_PATH", "").strip())


def run_nest_stage(state: PipelineMutableState) -> StageEnvelope[NestStageData]:
    def _run() -> tuple[NestStageData, StageAvailability, str | None]:
        empty = NestStageData(
            label_id=None,
            group_id=None,
            confidence=0.0,
            novel=False,
            coarse_auto_apply=False,
            fine_suggest=False,
        )
        if not state.text.strip():
            return empty, StageAvailability.UNCERTAIN, "no document text for classification"
        if not _nest_state_configured():
            return (
                empty,
                StageAvailability.NOT_AVAILABLE,
                "NEST calibrated density state not configured (set NEST_EMBEDDING_STATE_PATH)",
            )
        return (
            empty,
            StageAvailability.NOT_AVAILABLE,
            "NEST_EMBEDDING_STATE_PATH set; document classification wiring not available",
        )

    (data, availability, detail), metrics = measure_stage(_run)
    return StageEnvelope(
        stage_id=STAGE_ID,
        availability=availability,
        metrics=metrics,
        data=data,
        detail=detail,
    )
