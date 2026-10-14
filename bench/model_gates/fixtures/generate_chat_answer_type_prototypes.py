#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Embed labeled answer-type training questions; write prototype JSON for API cited-chat."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "apps" / "worker" / "src"))

from docuvate_worker.infrastructure.fastembed_model import embed_query

TRAINING = ROOT / "bench/model_gates/fixtures/chat_answer_type_training.json"
SMOKE_MANIFEST = ROOT / "tools/smoke-bench/manifest.json"
OUT = (
    ROOT
    / "apps/api/src/modules/cited-chat/domain/chat-answer-type-prototypes.json"
)


def _normalize_question(text: str) -> str:
    return " ".join(text.strip().split()).casefold()


def _assert_no_smoke_leakage(training: dict[str, object]) -> None:
    manifest = json.loads(SMOKE_MANIFEST.read_text(encoding="utf-8"))
    smoke = {
        _normalize_question(str(row["question"]))
        for row in manifest.get("chatChecks", [])
        if isinstance(row, dict) and row.get("question")
    }
    types_raw = training.get("answer_types", {})
    if not isinstance(types_raw, dict):
        raise SystemExit("answer_types must be an object")
    phrases: list[str] = []
    for value in types_raw.values():
        if isinstance(value, list):
            phrases.extend(str(p) for p in value)
    overlap = smoke & {_normalize_question(p) for p in phrases}
    if overlap:
        raise SystemExit(f"training contains smoke manifest questions: {sorted(overlap)}")


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b, strict=True))
    na = sum(x * x for x in a) ** 0.5
    nb = sum(y * y for y in b) ** 0.5
    if na == 0 or nb == 0:
        return 0.0
    return float(dot / (na * nb))


def _classify(
    query_vec: list[float],
    prototypes: dict[str, list[float]],
    *,
    min_score: float,
    min_margin: float,
    default: str,
) -> str:
    scored = sorted(
        ((name, _cosine(query_vec, vec)) for name, vec in prototypes.items()),
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


def _training_accuracy(
    labeled: list[tuple[str, list[float]]],
    prototypes: dict[str, list[float]],
    *,
    min_score: float,
    min_margin: float,
) -> float:
    if not labeled:
        return 0.0
    hits = 0
    for label, vec in labeled:
        if (
            _classify(
                vec,
                prototypes,
                min_score=min_score,
                min_margin=min_margin,
                default="free_text",
            )
            == label
        ):
            hits += 1
    return hits / len(labeled)


def _pick_min_margin(
    labeled: list[tuple[str, list[float]]],
    prototypes: dict[str, list[float]],
    *,
    min_score: float,
) -> float:
    candidates = [round(x, 3) for x in [0.008, 0.01, 0.012, 0.015, 0.018, 0.02, 0.025, 0.03, 0.035]]
    best_margin = candidates[-1]
    best_acc = -1.0
    for margin in candidates:
        acc = _training_accuracy(
            labeled, prototypes, min_score=min_score, min_margin=margin
        )
        if acc > best_acc + 1e-9:
            best_acc = acc
            best_margin = margin
        elif abs(acc - best_acc) < 1e-9 and margin < best_margin:
            best_margin = margin
    if best_acc < 0.85:
        raise SystemExit(f"training accuracy {best_acc:.3f} below 0.85; expand training phrases")
    return best_margin


def _centroid(texts: list[str]) -> list[float]:
    vecs = [embed_query(t) for t in texts]
    if not vecs:
        return []
    dim = len(vecs[0])
    acc = [0.0] * dim
    for vec in vecs:
        for i, v in enumerate(vec):
            acc[i] += v
    n = float(len(vecs))
    return [v / n for v in acc]


def main() -> None:
    embed_query("warmup")
    training = json.loads(TRAINING.read_text(encoding="utf-8"))
    _assert_no_smoke_leakage(training)
    types_raw = training.get("answer_types", {})
    if not isinstance(types_raw, dict):
        raise SystemExit("answer_types must be an object")
    prototypes: dict[str, list[float]] = {}
    for name, phrases in types_raw.items():
        if not isinstance(name, str) or not isinstance(phrases, list):
            continue
        texts = [str(p) for p in phrases if str(p).strip()]
        prototypes[name] = _centroid(texts)

    labeled: list[tuple[str, list[float]]] = []
    for name, phrases in types_raw.items():
        if not isinstance(name, str) or not isinstance(phrases, list):
            continue
        for phrase in phrases:
            text = str(phrase).strip()
            if text:
                labeled.append((name, embed_query(text)))

    min_score = 0.72
    min_margin = _pick_min_margin(labeled, prototypes, min_score=min_score)

    payload = {
        "version": 1,
        "encoder": "intfloat/multilingual-e5-small",
        "encoder_revision": "614241f622f53c4eeff9890bdc4f31cfecc418b3-onnx-int8",
        "training_source": "bench/model_gates/fixtures/chat_answer_type_training.json",
        "answer_types": prototypes,
        "min_score": min_score,
        "min_margin": min_margin,
        "default_answer_type": "free_text",
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
