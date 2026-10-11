# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from docuvate_worker.domain.cpu_pipeline.kite_chunks import split_passage_chunks
from docuvate_worker.domain.cpu_pipeline.luna_features import (
    normalize_blocks_to_text_mirror,
)
from docuvate_worker.domain.cpu_pipeline.metrics import measure_stage
from docuvate_worker.domain.cpu_pipeline.taco_header import infer_header_row_count
from docuvate_worker.domain.layout_ir import LayoutIrTable, LayoutIrTableCell
from docuvate_worker.domain.models import ExtractionBlock


def test_split_passage_chunks_overlap() -> None:
    text = "word " * 120
    chunks = split_passage_chunks(text)
    assert len(chunks) >= 2
    assert all(len(c) <= 320 for c in chunks)


def test_text_mirror_normalization_scales_to_unit_square() -> None:
    blocks = (
        ExtractionBlock(page=1, x=0.1, y=0.2, width=0.2, height=0.1, text="A", block_index=0),
        ExtractionBlock(page=1, x=0.5, y=0.6, width=0.3, height=0.2, text="B", block_index=1),
    )
    normalized = normalize_blocks_to_text_mirror(blocks)
    assert normalized[0].x == 0.0
    assert normalized[1].x > normalized[0].x


def test_taco_header_prediction_error_prefers_consistent_body() -> None:
    rows = (
        (
            LayoutIrTableCell(text="H1", x=0, y=0, width=0.1, height=0.1),
            LayoutIrTableCell(text="H2", x=0.2, y=0, width=0.1, height=0.1),
        ),
        (
            LayoutIrTableCell(text="a", x=0, y=0.1, width=0.1, height=0.1),
            LayoutIrTableCell(text="b", x=0.2, y=0.1, width=0.1, height=0.1),
        ),
        (
            LayoutIrTableCell(text="c", x=0, y=0.2, width=0.1, height=0.1),
            LayoutIrTableCell(text="d", x=0.2, y=0.2, width=0.1, height=0.1),
        ),
    )
    table = LayoutIrTable(page=1, x=0, y=0, width=0.5, height=0.5, rows=rows, column_count=2)
    header_rows, method = infer_header_row_count(table)
    assert header_rows == 1
    assert method == "prediction_error"


def test_measure_stage_records_positive_wall_time() -> None:
    def work() -> int:
        return 42

    value, metrics = measure_stage(work)
    assert value == 42
    assert metrics.wall_time_ms > 0.0
