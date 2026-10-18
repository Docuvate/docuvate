# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Held-out answer-type classification gate (embedding prototypes, no training leakage)."""

# pyright: reportUnknownVariableType=false, reportUnknownArgumentType=false, reportUnnecessaryIsInstance=false

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, cast

from docuvate_worker.infrastructure.fastembed_model import embed_query

from bench.model_gates.schema import GateRunResult, MetricValue

GATE_ID = "chat_answer_type"
ROOT = Path(__file__).resolve().parents[3]
EVAL_PATH = ROOT / "eval" / "chat_de" / "answer_type_eval.json"
PROTO_PATH = (
    ROOT / "apps" / "api" / "src" / "modules" / "cited-chat" / "domain" / "chat-answer-type-prototypes.json"
)


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b, strict=True))
    na = sum(x * x for x in a) ** 0.5
    nb = sum(y * y for y in b) ** 0.5
    if na == 0 or nb == 0:
        return 0.0
    return float(dot / (na * nb))


def _proto_float(proto: dict[str, Any], key: str, default: float) -> float:
    val = proto.get(key, default)
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        try:
            return float(val)
        except ValueError:
            return default
    return default


def _answer_type_vectors(types_raw: dict[str, Any]) -> dict[str, list[float]]:
    out: dict[str, list[float]] = {}
    for name, vec in types_raw.items():
        if not isinstance(name, str) or not isinstance(vec, list):
            continue
        out[name] = [float(x) for x in vec]
    return out


def _classify(query_vec: list[float], proto: dict[str, Any]) -> str:
    types_raw = proto.get("answer_types", {})
    if not isinstance(types_raw, dict):
        return str(proto.get("default_answer_type", "free_text"))
    min_score = _proto_float(proto, "min_score", 0.72)
    min_margin = _proto_float(proto, "min_margin", 0.035)
    default = str(proto.get("default_answer_type", "free_text"))
    types = _answer_type_vectors(types_raw)
    scored = sorted(
        ((name, _cosine(query_vec, vec)) for name, vec in types.items()),
        key=lambda row: row[1],
        reverse=True,
    )
    if not scored:
        return default
    best_name, best_score = scored[0]
    second = scored[1][1] if len(scored) > 1 else 0.0
    if best_score < min_score or best_score - second < min_margin:
        return default
    return best_name


def run_chat_answer_type_gate() -> GateRunResult:
    if not EVAL_PATH.is_file() or not PROTO_PATH.is_file():
        return GateRunResult(
            gate_id=GATE_ID,
            status="error",
            metrics=(),
            detail="missing eval or answer-type prototype fixtures",
        )
    eval_data = cast(dict[str, Any], json.loads(EVAL_PATH.read_text(encoding="utf-8")))
    proto = cast(dict[str, Any], json.loads(PROTO_PATH.read_text(encoding="utf-8")))
    cases_raw = eval_data.get("cases", [])
    if not isinstance(cases_raw, list) or len(cases_raw) < 20:
        return GateRunResult(
            gate_id=GATE_ID,
            status="error",
            metrics=(),
            detail=f"expected >=20 held-out cases, got {len(cases_raw) if isinstance(cases_raw, list) else 0}",
        )

    embed_query("warmup")
    hits = 0
    total = 0
    smoke_manifest_hits = 0
    smoke_manifest_total = 0

    for case_raw in cases_raw:
        if not isinstance(case_raw, dict):
            continue
        case = cast(dict[str, Any], case_raw)
        question = str(case.get("question", "")).strip()
        expected = str(case.get("expected_answer_type", "free_text"))
        if not question:
            continue
        predicted = _classify(embed_query(question), proto)
        total += 1
        if predicted == expected:
            hits += 1
        note = case.get("note")
        if isinstance(note, str) and "smoke" in note.lower():
            smoke_manifest_total += 1
            if predicted == expected:
                smoke_manifest_hits += 1

    accuracy = hits / total if total else 0.0
    smoke_accuracy = (
        1.0 if smoke_manifest_total == 0 else smoke_manifest_hits / smoke_manifest_total
    )

    metrics = (
        MetricValue(
            name=f"{GATE_ID}.accuracy",
            value=accuracy,
            direction="higher_is_better",
        ),
        MetricValue(
            name=f"{GATE_ID}.smoke_phrasing_accuracy",
            value=smoke_accuracy,
            direction="higher_is_better",
        ),
    )
    return GateRunResult(
        gate_id=GATE_ID,
        status="ok",
        metrics=metrics,
        detail=f"{total} held-out answer-type cases",
    )
