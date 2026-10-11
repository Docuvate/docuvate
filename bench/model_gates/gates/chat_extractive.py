# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Extractive document chat gate (context_qa, CPU embeddings)."""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import TypedDict, cast

from docuvate_worker.infrastructure.chat.context_qa import (
    answer_from_document_context,
    retrieve_document_rag_context,
)
from docuvate_worker.infrastructure.fastembed_model import embed_query

from bench.model_gates.schema import GateRunResult, MetricValue

GATE_ID = "chat_extractive"


class ChatField(TypedDict):
    key: str
    value: str


class ChatCase(TypedDict):
    id: str
    question: str
    title: str
    filename: str
    text: str
    fields: list[ChatField]
    answer_must_contain: list[str]
    evidence_in_retrieval: list[str]
    expect_abstain: bool


def _percentile(values: list[float], pct: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    idx = min(len(ordered) - 1, max(0, int(round((pct / 100.0) * (len(ordered) - 1)))))
    return ordered[idx]


def _field_list(raw: object) -> list[ChatField]:
    if not isinstance(raw, list):
        return []
    fields: list[ChatField] = []
    raw_list = cast(list[object], raw)
    for item_obj in raw_list:
        if not isinstance(item_obj, dict):
            continue
        item = cast(dict[str, object], item_obj)
        key = item.get("key")
        value = item.get("value")
        if isinstance(key, str) and isinstance(value, str):
            fields.append(ChatField(key=key, value=value))
    return fields


def _str_list(raw: object) -> list[str]:
    if not isinstance(raw, list):
        return []
    out: list[str] = []
    raw_list = cast(list[object], raw)
    for item_obj in raw_list:
        if isinstance(item_obj, (str, int, float)):
            out.append(str(item_obj))
    return out


def _load_cases(fixtures_path: Path) -> list[ChatCase]:
    payload_obj: object = json.loads(fixtures_path.read_text(encoding="utf-8"))
    if not isinstance(payload_obj, dict):
        raise ValueError("chat fixtures root must be an object")
    payload = cast(dict[str, object], payload_obj)
    cases_raw = payload.get("cases")
    if not isinstance(cases_raw, list):
        raise ValueError("chat fixtures must contain cases[]")
    cases: list[ChatCase] = []
    cases_list = cast(list[object], cases_raw)
    for entry_obj in cases_list:
        if not isinstance(entry_obj, dict):
            raise ValueError("chat case must be an object")
        entry = cast(dict[str, object], entry_obj)
        cases.append(
            ChatCase(
                id=str(entry["id"]),
                question=str(entry["question"]),
                title=str(entry.get("title", "")),
                filename=str(entry.get("filename", "fixture.pdf")),
                text=str(entry["text"]),
                fields=_field_list(entry.get("fields")),
                answer_must_contain=_str_list(entry.get("answer_must_contain")),
                evidence_in_retrieval=_str_list(entry.get("evidence_in_retrieval")),
                expect_abstain=bool(entry.get("expect_abstain", False)),
            )
        )
    return cases


def run_chat_extractive_gate(fixtures_path: Path) -> GateRunResult:
    cases = _load_cases(fixtures_path)
    embed_query("Docuvate model-gates warmup")
    if not cases:
        return GateRunResult(
            gate_id=GATE_ID,
            status="error",
            metrics=(),
            detail="no chat cases loaded",
        )

    answer_hits = 0
    citation_hits = 0
    citation_total = 0
    latencies_ms: list[float] = []

    for case in cases:
        field_dicts: list[dict[str, str]] = [
            {"key": field["key"], "value": field["value"]} for field in case["fields"]
        ]
        t0 = time.perf_counter()
        answer = answer_from_document_context(
            case["question"],
            title=case["title"],
            filename=case["filename"],
            text=case["text"],
            fields=field_dicts,
        )
        retrieval = retrieve_document_rag_context(
            case["question"],
            title=case["title"],
            filename=case["filename"],
            text=case["text"],
            fields=field_dicts,
        )
        latencies_ms.append((time.perf_counter() - t0) * 1000.0)

        lower_answer = answer.lower()
        if case["expect_abstain"]:
            abstained = "keinen eindeutigen treffer" in lower_answer or "keinen passenden" in lower_answer
            if abstained:
                answer_hits += 1
        else:
            if all(fragment.lower() in lower_answer for fragment in case["answer_must_contain"]):
                answer_hits += 1

        if case["evidence_in_retrieval"]:
            citation_total += 1
            joined = "\n".join(retrieval.chunks).lower()
            if all(ev.lower() in joined for ev in case["evidence_in_retrieval"]):
                citation_hits += 1

    n = len(cases)
    answer_accuracy = answer_hits / n
    citation_precision = 1.0 if citation_total == 0 else citation_hits / citation_total
    latency_p95 = _percentile(latencies_ms, 95.0)

    metrics = (
        MetricValue(
            name=f"{GATE_ID}.answer_accuracy",
            value=answer_accuracy,
            direction="higher_is_better",
        ),
        MetricValue(
            name=f"{GATE_ID}.citation_precision",
            value=citation_precision,
            direction="higher_is_better",
        ),
        MetricValue(
            name=f"{GATE_ID}.latency_p95_ms",
            value=latency_p95,
            direction="lower_is_better",
        ),
    )
    return GateRunResult(gate_id=GATE_ID, status="ok", metrics=metrics, detail=f"{n} cases")
