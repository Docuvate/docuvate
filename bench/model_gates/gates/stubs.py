# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Placeholder gates for components filled in by later PRs."""

from __future__ import annotations

from bench.model_gates.schema import GateRunResult

_STUBS: tuple[tuple[str, str], ...] = (
    ("layout_blocks", "Macro-F1 on annotated pages (FUNSD slice) — PR 6"),
    ("tables", "Row/column F1 on balance-sheet fixture — PR 7"),
    ("ocr", "German scan CER gate — PR 8"),
    ("embeddings", "Recall@k on DE document retrieval — PR 3"),
    ("reranker", "Recall@10 and MRR gate — PR 3"),
    ("chat_llm", "Cited LLM chat accuracy/latency — PR 2"),
    ("duplicates", "Duplicate-pair precision — PR 9"),
)


def run_stub_gates() -> tuple[GateRunResult, ...]:
    return tuple(
        GateRunResult(gate_id=gate_id, status="stub", metrics=(), detail=note) for gate_id, note in _STUBS
    )
