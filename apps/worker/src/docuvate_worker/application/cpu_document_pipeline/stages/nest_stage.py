# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from docuvate_worker.application.embedding_density import classify_embedding
from docuvate_worker.domain.cpu_pipeline.contracts import (
    NestStageData,
    PipelineMutableState,
    StageAvailability,
    StageEnvelope,
)
from docuvate_worker.domain.cpu_pipeline.metrics import measure_stage
from docuvate_worker.domain.embedding_density.decision import DecisionTier, ReasonCode
from docuvate_worker.infrastructure.fastembed_model import embed_passages

STAGE_ID = "nest_classification"


def _nest_data_from_classify(
    *,
    label_id: str | None,
    group_id: str | None,
    confidence: float,
    reason: str,
    decision_tier: str,
) -> NestStageData:
    return NestStageData(
        label_id=label_id,
        group_id=group_id,
        confidence=confidence,
        novel=reason == ReasonCode.NOVELTY.value,
        coarse_auto_apply=decision_tier == DecisionTier.AUTO_APPLY.value,
        fine_suggest=decision_tier == DecisionTier.CONFIRM.value,
    )


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
        calibrated = state.embedding_density_state
        if calibrated is None or not calibrated.label_ids:
            return (
                empty,
                StageAvailability.NOT_AVAILABLE,
                "no per-org calibrated embedding-density state supplied",
            )
        try:
            vectors = embed_passages([state.text[:4000]])
        except Exception as exc:
            return (
                empty,
                StageAvailability.NOT_AVAILABLE,
                f"document embedding unavailable: {type(exc).__name__}",
            )
        if not vectors:
            return empty, StageAvailability.UNCERTAIN, "embedding produced empty vector"
        vector = vectors[0]
        if calibrated.dim > 0 and len(vector) != calibrated.dim:
            return (
                empty,
                StageAvailability.NOT_AVAILABLE,
                f"embedding dim {len(vector)} does not match calibrated state dim {calibrated.dim}",
            )
        result = classify_embedding(calibrated, vector)
        data = _nest_data_from_classify(
            label_id=result.label_id,
            group_id=result.group_id,
            confidence=result.confidence,
            reason=result.reason,
            decision_tier=result.decision_tier,
        )
        return data, StageAvailability.OK, None

    (data, availability, detail), metrics = measure_stage(_run)
    return StageEnvelope(
        stage_id=STAGE_ID,
        availability=availability,
        metrics=metrics,
        data=data,
        detail=detail,
    )
