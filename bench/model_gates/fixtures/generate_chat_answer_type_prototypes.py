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
OUT = (
    ROOT
    / "apps/api/src/modules/cited-chat/domain/chat-answer-type-prototypes.json"
)


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
    types_raw = training.get("answer_types", {})
    if not isinstance(types_raw, dict):
        raise SystemExit("answer_types must be an object")
    prototypes: dict[str, list[float]] = {}
    for name, phrases in types_raw.items():
        if not isinstance(name, str) or not isinstance(phrases, list):
            continue
        texts = [str(p) for p in phrases if str(p).strip()]
        prototypes[name] = _centroid(texts)

    payload = {
        "version": 1,
        "encoder": "intfloat/multilingual-e5-small",
        "encoder_revision": "614241f622f53c4eeff9890bdc4f31cfecc418b3-onnx-int8",
        "training_source": "bench/model_gates/fixtures/chat_answer_type_training.json",
        "answer_types": prototypes,
        "min_score": 0.72,
        "min_margin": 0.035,
        "default_answer_type": "free_text",
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
