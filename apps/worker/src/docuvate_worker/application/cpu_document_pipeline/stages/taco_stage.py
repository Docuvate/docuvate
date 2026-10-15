# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from docuvate_worker.domain.cpu_pipeline.contracts import (
    PipelineMutableState,
    StageAvailability,
    StageEnvelope,
    TacoSpanSuggestion,
    TacoStageData,
    TacoTableResult,
)
from docuvate_worker.domain.cpu_pipeline.metrics import measure_stage
from docuvate_worker.domain.cpu_pipeline.taco_header import infer_header_row_count

STAGE_ID = "taco_tables"


def run_taco_stage(state: PipelineMutableState) -> StageEnvelope[TacoStageData]:
    def _run() -> tuple[TacoStageData, StageAvailability, str | None]:
        if state.mime_type != "application/pdf":
            return (
                TacoStageData(tables=()),
                StageAvailability.NOT_AVAILABLE,
                "table stage requires PDF bytes",
            )
        try:
            from docuvate_worker.infrastructure.layout.layout_pdf_cache import (  # noqa: PLC0415
                get_or_extract_layout_pdf,
            )
        except Exception as exc:
            return (
                TacoStageData(tables=()),
                StageAvailability.NOT_AVAILABLE,
                f"layout extract unavailable: {type(exc).__name__}",
            )
        layout = get_or_extract_layout_pdf(state)
        if layout is None:
            return (
                TacoStageData(tables=()),
                StageAvailability.FALLBACK,
                "no layout tables detected",
            )
        results: list[TacoTableResult] = []
        table_index = 0
        for page in layout.pages:
            for table in page.tables:
                header_rows, method = infer_header_row_count(table)
                spans: list[TacoSpanSuggestion] = []
                if table.rows:
                    first = table.rows[0]
                    for col_idx, cell in enumerate(first):
                        if len(cell.text.split()) > 3:
                            spans.append(
                                TacoSpanSuggestion(
                                    row=0,
                                    col=col_idx,
                                    row_span=1,
                                    col_span=1,
                                    confidence=0.45,
                                )
                            )
                results.append(
                    TacoTableResult(
                        table_index=table_index,
                        column_count=max(table.column_count, 1),
                        header_row_count=header_rows,
                        header_method=method,
                        span_suggestions=tuple(spans),
                    )
                )
                table_index += 1
        availability = StageAvailability.OK if results else StageAvailability.FALLBACK
        detail = None if results else "fallback header rule only"
        return TacoStageData(tables=tuple(results)), availability, detail

    (data, availability, detail), metrics = measure_stage(_run)
    return StageEnvelope(
        stage_id=STAGE_ID,
        availability=availability,
        metrics=metrics,
        data=data,
        detail=detail,
    )
