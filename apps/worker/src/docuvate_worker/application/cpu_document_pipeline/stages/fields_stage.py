# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import contextlib
import importlib
import logging

from docuvate_worker.domain.cpu_pipeline.contracts import (
    FieldSuggestionsStageData,
    PipelineMutableState,
    StageAvailability,
    StageEnvelope,
)
from docuvate_worker.domain.cpu_pipeline.metrics import measure_stage
from docuvate_worker.domain.models import ExtractedField
from docuvate_worker.infrastructure.extract_memory.model_residency import (
    extract_keep_models_resident,
)
from docuvate_worker.infrastructure.extractors.heuristic_fields import heuristic_field_suggestions

STAGE_ID = "field_suggestions"

logger = logging.getLogger(__name__)

_FIELD_SUGGESTIONS_FACADE = (
    "docuvate_worker.application.cpu_document_pipeline.stages.field_suggestions_ml_facade"
)


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
        ml = importlib.import_module(_FIELD_SUGGESTIONS_FACADE)
        suggestions = heuristic_field_suggestions(state.text)
        layout_rows: list[ExtractedField] = []
        if state.layout_key_value_roles and state.blocks:
            try:
                layout_rows = ml.run_layout_kv_field_suggestions(
                    list(state.blocks),
                    state.document_representation,
                    recognized_field_keys=state.recognized_field_keys,
                    existing_field_keys=frozenset(
                        row.key for row in suggestions if row.key.strip()
                    ),
                )
            except Exception as exc:
                logger.warning(
                    "layout_kv_field_suggestions_failed type=%s",
                    type(exc).__name__,
                    exc_info=exc,
                )
                layout_rows = []
        docai_rows: list[ExtractedField] = []
        if state.blocks and len(state.blocks) >= 2:
            try:
                docai_rows = ml.run_docai_field_suggestions(
                    list(state.blocks),
                    recognized_field_keys=state.recognized_field_keys,
                    existing_field_keys=frozenset(
                        row.key for row in (*suggestions, *layout_rows) if row.key.strip()
                    ),
                )
            except Exception as exc:
                logger.warning(
                    "docai_field_suggestions_failed type=%s",
                    type(exc).__name__,
                    exc_info=exc,
                )
                docai_rows = []
        merged = _merge_suggestions(_merge_suggestions(tuple(suggestions), layout_rows), docai_rows)
        return FieldSuggestionsStageData(suggestions=merged)

    def _run_wrapped() -> FieldSuggestionsStageData:
        try:
            return _run()
        finally:
            if not extract_keep_models_resident():
                with contextlib.suppress(Exception):
                    ml = importlib.import_module(_FIELD_SUGGESTIONS_FACADE)
                    ml.release_docai_models()

    data, metrics = measure_stage(_run_wrapped)
    return StageEnvelope(
        stage_id=STAGE_ID,
        availability=StageAvailability.OK,
        metrics=metrics,
        data=data,
        detail=None,
    )
