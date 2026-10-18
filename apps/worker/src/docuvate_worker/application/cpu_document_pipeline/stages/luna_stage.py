# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from docuvate_worker.domain.cpu_pipeline.contracts import (
    LunaBlockLabel,
    LunaStageData,
    PipelineMutableState,
    StageAvailability,
    StageEnvelope,
)
from docuvate_worker.domain.cpu_pipeline.luna_features import (
    normalize_blocks_to_text_mirror,
)
from docuvate_worker.domain.cpu_pipeline.metrics import measure_stage

STAGE_ID = "luna_layout"


def run_luna_stage(state: PipelineMutableState) -> StageEnvelope[LunaStageData]:
    def _run() -> tuple[LunaStageData, StageAvailability, str | None]:
        normalized = normalize_blocks_to_text_mirror(tuple(state.blocks))
        labels: list[LunaBlockLabel] = []
        for block in normalized:
            idx = block.block_index if block.block_index is not None else 0
            labels.append(
                LunaBlockLabel(
                    block_index=idx,
                    label=None,
                    confidence=0.0,
                    auto_apply=False,
                    review_suggested=bool(block.text.strip()),
                )
            )
        return (
            LunaStageData(labels=tuple(labels)),
            StageAvailability.NOT_AVAILABLE,
            "LUNA linear classifier weights not shipped; default block geometry unchanged",
        )

    (data, availability, detail), metrics = measure_stage(_run)
    return StageEnvelope(
        stage_id=STAGE_ID,
        availability=availability,
        metrics=metrics,
        data=data,
        detail=detail,
    )
