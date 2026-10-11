# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Extractive document chat gate (context_qa, CPU embeddings)."""

from __future__ import annotations

import time
from pathlib import Path

from docuvate_worker.infrastructure.chat.context_qa import (
    DocumentContextInput,
    RagRetrievalResult,
    answer_from_document_context,
    answer_from_library_context,
    extractive_answer_abstained,
    retrieve_document_rag_context,
    retrieve_library_rag_context,
)
from docuvate_worker.infrastructure.fastembed_model import embed_query

from bench.model_gates.json_models import ChatCaseModel, ChatFixturesFile
from bench.model_gates.schema import GateRunResult, MetricValue

GATE_ID = "chat_extractive"


def _percentile(values: list[float], pct: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    idx = min(len(ordered) - 1, max(0, int(round((pct / 100.0) * (len(ordered) - 1)))))
    return ordered[idx]


def _load_fixtures(fixtures_path: Path) -> ChatFixturesFile:
    return ChatFixturesFile.model_validate_json(fixtures_path.read_text(encoding="utf-8"))


def _to_inputs(case: ChatCaseModel) -> list[DocumentContextInput]:
    return [
        DocumentContextInput(
            title=doc.title,
            filename=doc.filename,
            text=doc.text,
            fields=[{"key": f.key, "value": f.value} for f in doc.fields],
        )
        for doc in case.documents
    ]


def _answer_case(case: ChatCaseModel) -> str:
    docs = _to_inputs(case)
    if case.kind == "multi_doc" or len(docs) > 1:
        return answer_from_library_context(case.question, docs)
    doc = docs[0]
    return answer_from_document_context(
        case.question,
        title=doc.title,
        filename=doc.filename,
        text=doc.text,
        fields=doc.fields,
    )


def _retrieve_case(case: ChatCaseModel) -> RagRetrievalResult:
    docs = _to_inputs(case)
    if case.kind == "multi_doc" or len(docs) > 1:
        return retrieve_library_rag_context(case.question, docs)
    doc = docs[0]
    return retrieve_document_rag_context(
        case.question,
        title=doc.title,
        filename=doc.filename,
        text=doc.text,
        fields=doc.fields,
    )


def run_chat_extractive_gate(fixtures_path: Path) -> GateRunResult:
    fixtures = _load_fixtures(fixtures_path)
    embed_query("Docuvate model-gates warmup")
    cases = fixtures.cases
    if not cases:
        return GateRunResult(
            gate_id=GATE_ID,
            status="error",
            metrics=(),
            detail="no chat cases loaded",
        )

    answerable_hits = 0
    answerable_total = 0
    abstain_tp = 0
    abstain_fp = 0
    abstain_fn = 0
    abstain_tn = 0
    citation_hits = 0
    citation_total = 0
    multi_hits = 0
    multi_total = 0
    open_hits = 0
    open_total = 0
    latencies_ms: list[float] = []

    for case in cases:
        t0 = time.perf_counter()
        answer = _answer_case(case)
        retrieval = _retrieve_case(case)
        latencies_ms.append((time.perf_counter() - t0) * 1000.0)
        abstained = extractive_answer_abstained(answer)
        expect_abstain = case.kind == "unanswerable"

        if expect_abstain:
            if abstained:
                abstain_tp += 1
            else:
                abstain_fn += 1
        elif abstained:
            abstain_fp += 1
        else:
            abstain_tn += 1

        if case.kind == "answerable":
            answerable_total += 1
            if all(fragment.lower() in answer.lower() for fragment in case.answer_must_contain):
                answerable_hits += 1
            if case.evidence_in_retrieval:
                citation_total += 1
                joined = "\n".join(retrieval.chunks).lower()
                if all(ev.lower() in joined for ev in case.evidence_in_retrieval):
                    citation_hits += 1

        if case.kind == "multi_doc":
            multi_total += 1
            lower = answer.lower()
            joined_chunks = "\n".join(retrieval.chunks).lower()
            tags_ok = (
                all(tag.lower() in joined_chunks for tag in case.required_source_tags)
                if case.required_source_tags
                else True
            )
            text_ok = all(fragment.lower() in lower for fragment in case.answer_must_contain)
            if tags_ok and text_ok:
                multi_hits += 1

        if case.kind == "open":
            open_total += 1
            lower = answer.lower()
            if any(token.lower() in lower for token in case.acceptable_answers):
                open_hits += 1

    answer_accuracy = 0.0 if answerable_total == 0 else answerable_hits / answerable_total
    abstain_precision = 0.0 if abstain_tp + abstain_fp == 0 else abstain_tp / (abstain_tp + abstain_fp)
    abstain_recall = 0.0 if abstain_tp + abstain_fn == 0 else abstain_tp / (abstain_tp + abstain_fn)
    citation_precision = 1.0 if citation_total == 0 else citation_hits / citation_total
    multi_doc_accuracy = 0.0 if multi_total == 0 else multi_hits / multi_total
    open_accuracy = 0.0 if open_total == 0 else open_hits / open_total
    latency_p95 = _percentile(latencies_ms, 95.0)

    metrics = (
        MetricValue(
            name=f"{GATE_ID}.answer_accuracy",
            value=answer_accuracy,
            direction="higher_is_better",
        ),
        MetricValue(
            name=f"{GATE_ID}.abstention_precision",
            value=abstain_precision,
            direction="higher_is_better",
        ),
        MetricValue(
            name=f"{GATE_ID}.abstention_recall",
            value=abstain_recall,
            direction="higher_is_better",
        ),
        MetricValue(
            name=f"{GATE_ID}.citation_precision",
            value=citation_precision,
            direction="higher_is_better",
        ),
        MetricValue(
            name=f"{GATE_ID}.multi_doc_accuracy",
            value=multi_doc_accuracy,
            direction="higher_is_better",
        ),
        MetricValue(
            name=f"{GATE_ID}.open_question_accuracy",
            value=open_accuracy,
            direction="higher_is_better",
        ),
        MetricValue(
            name=f"{GATE_ID}.latency_p95_ms",
            value=latency_p95,
            direction="lower_is_better",
        ),
    )
    return GateRunResult(
        gate_id=GATE_ID,
        status="ok",
        metrics=metrics,
        detail=f"{len(cases)} cases",
    )
