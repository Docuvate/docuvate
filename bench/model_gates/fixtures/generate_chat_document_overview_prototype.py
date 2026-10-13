#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Embed generic document-overview seed phrases for scoped full-doc retrieval."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "apps" / "worker" / "src"))

from docuvate_worker.infrastructure.fastembed_model import embed_query

OUT = (
    ROOT
    / "apps/api/src/modules/cited-chat/domain/chat-document-overview-prototypes.json"
)

SEED_PHRASES = [
    "Worum geht es in diesem Dokument?",
    "Was ist der Inhalt dieses Dokuments?",
    "Fasse dieses Dokument zusammen.",
    "What is this document about?",
    "Summarize this document.",
    "Give me an overview of this file.",
]


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
    payload = {
        "version": 1,
        "encoder": "intfloat/multilingual-e5-small",
        "positive": _centroid(SEED_PHRASES),
        "min_score": 0.72,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
