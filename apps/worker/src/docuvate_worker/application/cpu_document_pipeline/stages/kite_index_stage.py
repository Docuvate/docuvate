# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from docuvate_worker.domain.cpu_pipeline.contracts import (
    KiteIndexChunk,
    KiteIndexStageData,
    PipelineMutableState,
    StageAvailability,
    StageEnvelope,
)
from docuvate_worker.domain.cpu_pipeline.metrics import measure_stage

STAGE_ID = "kite_index"


def run_kite_index_stage(state: PipelineMutableState) -> StageEnvelope[KiteIndexStageData]:
    def _run() -> tuple[KiteIndexStageData, StageAvailability, str | None]:
        rep = state.document_representation
        if rep is None:
            return (
                KiteIndexStageData(chunks=(), candidate_reader_available=False),
                StageAvailability.NOT_AVAILABLE,
                "no document representation for index metadata",
            )
        indexed: list[KiteIndexChunk] = []
        for encoded in rep.units:
            indexed.append(
                KiteIndexChunk(
                    chunk_id=f"unit-{encoded.unit.unit_index}",
                    level=encoded.unit.kind,
                    text=encoded.unit.text,
                    embedding_dim=384,
                )
            )
        if rep.document_mean_int8:
            indexed.append(
                KiteIndexChunk(
                    chunk_id="document-root",
                    level="document",
                    text=state.text[:4000],
                    embedding_dim=384,
                )
            )
        availability = StageAvailability.OK if indexed else StageAvailability.UNCERTAIN
        detail = (
            "index metadata from central representation"
            if indexed
            else "representation contained no units"
        )
        return (
            KiteIndexStageData(chunks=tuple(indexed), candidate_reader_available=False),
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
