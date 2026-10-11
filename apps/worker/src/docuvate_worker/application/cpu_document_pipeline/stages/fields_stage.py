# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from docuvate_worker.domain.cpu_pipeline.contracts import (
    FieldSuggestionsStageData,
    PipelineMutableState,
    StageAvailability,
    StageEnvelope,
)
from docuvate_worker.domain.cpu_pipeline.metrics import measure_stage
from docuvate_worker.infrastructure.extractors.heuristic_fields import heuristic_field_suggestions

STAGE_ID = "field_suggestions"


def run_fields_stage(state: PipelineMutableState) -> StageEnvelope[FieldSuggestionsStageData]:
    def _run() -> FieldSuggestionsStageData:
        suggestions = heuristic_field_suggestions(state.text)
        return FieldSuggestionsStageData(suggestions=tuple(suggestions))

    data, metrics = measure_stage(_run)
    return StageEnvelope(
        stage_id=STAGE_ID,
        availability=StageAvailability.OK,
        metrics=metrics,
        data=data,
        detail=None,
    )
