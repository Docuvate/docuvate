# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Chat query routing gate (intent prototypes + follow-up merge)."""

# pyright: reportUnknownVariableType=false, reportUnknownArgumentType=false, reportUnnecessaryIsInstance=false

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, cast

from docuvate_worker.infrastructure.fastembed_model import embed_query

from bench.model_gates.schema import GateRunResult, MetricValue

GATE_ID = "chat_routing"
ROOT = Path(__file__).resolve().parents[3]
EVAL_PATH = ROOT / "eval" / "chat_de" / "test.json"
INTENT_PATH = (
    ROOT / "apps" / "api" / "src" / "modules" / "cited-chat" / "domain" / "chat-intent-prototypes.json"
)


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b, strict=True))
    na = sum(x * x for x in a) ** 0.5
    nb = sum(y * y for y in b) ** 0.5
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


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


def _intent_vectors(intents_raw: dict[str, Any]) -> dict[str, list[float]]:
    out: dict[str, list[float]] = {}
    for name, vec in intents_raw.items():
        if not isinstance(name, str) or not isinstance(vec, list):
            continue
        out[name] = [float(x) for x in vec]
    return out


def _classify(query_vec: list[float], proto: dict[str, Any]) -> str:
    intents_raw = proto.get("intents", {})
    if not isinstance(intents_raw, dict):
        return str(proto.get("default_intent", "document_qa"))
    min_score = _proto_float(proto, "min_score", 0.74)
    min_margin = _proto_float(proto, "min_margin", 0.04)
    default = str(proto.get("default_intent", "document_qa"))
    intents = _intent_vectors(intents_raw)
    scored = sorted(
        ((name, _cosine(query_vec, vec)) for name, vec in intents.items()),
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


def _resolve_follow_up(current: str, prior: str | None, cur_vec: list[float], prior_vec: list[float] | None) -> str:
    if not prior or not prior_vec:
        return current.strip()
    if len(current.strip()) > 120:
        return current.strip()
    if _cosine(cur_vec, prior_vec) >= 0.55:
        return f"{prior.strip()} {current.strip()}".strip()
    return current.strip()


def run_chat_routing_gate() -> GateRunResult:
    if not EVAL_PATH.is_file() or not INTENT_PATH.is_file():
        return GateRunResult(
            gate_id=GATE_ID,
            status="error",
            metrics=(),
            detail="missing eval or prototype fixtures",
        )
    eval_data = cast(dict[str, Any], json.loads(EVAL_PATH.read_text(encoding="utf-8")))
    proto = cast(dict[str, Any], json.loads(INTENT_PATH.read_text(encoding="utf-8")))
    cases_raw = eval_data.get("cases", [])
    if not isinstance(cases_raw, list) or len(cases_raw) < 150:
        return GateRunResult(
            gate_id=GATE_ID,
            status="error",
            metrics=(),
            detail=f"expected >=150 cases, got {len(cases_raw) if isinstance(cases_raw, list) else 0}",
        )

    embed_query("warmup")
    intent_hits = 0
    intent_total = 0
    follow_hits = 0
    follow_total = 0

    for case_raw in cases_raw:
        if not isinstance(case_raw, dict):
            continue
        case = cast(dict[str, Any], case_raw)
        question = str(case.get("question", ""))
        prior = case.get("prior_user")
        prior_s = str(prior) if prior else None
        expected = str(case.get("expected_route", "document_qa"))
        cur_vec = embed_query(question)
        prior_vec = embed_query(prior_s) if prior_s else None
        resolved = _resolve_follow_up(question, prior_s, cur_vec, prior_vec)
        route_vec = embed_query(resolved) if resolved != question.strip() else cur_vec
        predicted = _classify(route_vec, proto)
        intent_total += 1
        if predicted == expected:
            intent_hits += 1
        must_contain = case.get("expect_resolved_contains")
        if isinstance(must_contain, list) and must_contain:
            follow_total += 1
            resolved_lower = resolved.lower()
            if all(str(tok).lower() in resolved_lower for tok in must_contain):
                follow_hits += 1

    intent_accuracy = intent_hits / intent_total if intent_total else 0.0
    follow_accuracy = 1.0 if follow_total == 0 else follow_hits / follow_total

    metrics = (
        MetricValue(
            name=f"{GATE_ID}.intent_accuracy",
            value=intent_accuracy,
            direction="higher_is_better",
        ),
        MetricValue(
            name=f"{GATE_ID}.follow_up_resolution",
            value=follow_accuracy,
            direction="higher_is_better",
        ),
    )
    return GateRunResult(
        gate_id=GATE_ID,
        status="ok",
        metrics=metrics,
        detail=f"{intent_total} routing cases",
    )
