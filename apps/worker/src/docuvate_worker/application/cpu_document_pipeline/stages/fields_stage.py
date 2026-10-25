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
from docuvate_worker.domain.models import ExtractedField
from docuvate_worker.infrastructure.extractors.heuristic_fields import heuristic_field_suggestions

STAGE_ID = "field_suggestions"


def _merge_suggestions(
    heuristic: tuple[ExtractedField, ...],
    layout_kv: list[ExtractedField],
) -> tuple[ExtractedField, ...]:
    merged: dict[str, ExtractedField] = {
        row.key.strip().lower(): row for row in heuristic if row.key.strip()
    }
    for row in layout_kv:
        key = row.key.strip().lower()
        if not key:
            continue
        existing = merged.get(key)
        if existing is None or (row.confidence or 0.0) >= (existing.confidence or 0.0):
            merged[key] = row
    return tuple(merged.values())


def run_fields_stage(state: PipelineMutableState) -> StageEnvelope[FieldSuggestionsStageData]:
    def _run() -> FieldSuggestionsStageData:
        suggestions = heuristic_field_suggestions(state.text)
        layout_rows: list[ExtractedField] = []
        if state.layout_key_value_roles and state.blocks:
            try:
                from docuvate_worker.infrastructure.ml.layout_kv_roles import (  # noqa: PLC0415
                    layout_kv_field_suggestions,
                )

                layout_rows = layout_kv_field_suggestions(
                    state.blocks,
                    state.document_representation,
                    recognized_field_keys=state.recognized_field_keys,
                    existing_field_keys=frozenset(
                        row.key for row in suggestions if row.key.strip()
                    ),
                )
            except Exception:
                layout_rows = []
        docai_rows: list[ExtractedField] = []
        if state.blocks and len(state.blocks) >= 2:
            try:
                from docuvate_worker.infrastructure.ml.ce_ml.docai_field_suggestions import (  # noqa: PLC0415
                    docai_kv_field_suggestions,
                )

                docai_rows = docai_kv_field_suggestions(
                    list(state.blocks),
                    recognized_field_keys=state.recognized_field_keys,
                    existing_field_keys=frozenset(
                        row.key for row in (*suggestions, *layout_rows) if row.key.strip()
                    ),
                )
            except Exception:
                docai_rows = []
        merged = _merge_suggestions(_merge_suggestions(tuple(suggestions), layout_rows), docai_rows)
        return FieldSuggestionsStageData(suggestions=merged)

    data, metrics = measure_stage(_run)
    return StageEnvelope(
        stage_id=STAGE_ID,
        availability=StageAvailability.OK,
        metrics=metrics,
        data=data,
        detail=None,
    )
