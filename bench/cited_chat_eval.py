#!/usr/bin/env python3
"""Small cited-chat latency eval (CPU, arm64-friendly). Reports platform and thread settings."""

from __future__ import annotations

import json
import os
import platform
import sys
import time
from pathlib import Path

# Repo root on path for worker imports when run from bench/
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "worker" / "src"))

from docuvate_worker.infrastructure.chat.rag_rerank import RagPassage, rerank_passages
from docuvate_worker.infrastructure.fastembed_model import embed_passages, embed_query


FIXTURE_QUESTIONS = [
    ("q1", "Welche Gesamtsumme steht auf der Rechnung Nordwind?"),
    ("q2", "Bis wann ist die Miete fällig?"),
    ("q3", "Welche Kündigungsfrist gilt im Vertrag?"),
    ("q4", "Was kostet die Hundesteuer?"),
    ("q5", "Welche IBAN hat der Absender?"),
]

PASSAGES = [
    RagPassage(id="c1", text="Rechnung Nordwind: Gesamtsumme 1.234,56 EUR, fällig 15.03."),
    RagPassage(id="c2", text="Mietvertrag: Miete bis zum 3. Werktag fällig."),
    RagPassage(id="c3", text="Vertrag: Kündigungsfrist drei Monate zum Quartalsende."),
]


def thread_settings() -> dict[str, str | int | None]:
    keys = (
        "OMP_NUM_THREADS",
        "OPENBLAS_NUM_THREADS",
        "MKL_NUM_THREADS",
        "OLLAMA_NUM_THREADS",
        "DOCUVATE_AI_PROFILE",
    )
    return {k: os.environ.get(k) for k in keys}


def main() -> int:
    meta = {
        "platform": platform.platform(),
        "machine": platform.machine(),
        "processor": platform.processor(),
        "python": platform.python_version(),
        "thread_settings": thread_settings(),
    }
    runs: list[dict[str, object]] = []

    for qid, question in FIXTURE_QUESTIONS:
        t0 = time.perf_counter()
        _ = embed_query(question)
        embed_ms = (time.perf_counter() - t0) * 1000

        t1 = time.perf_counter()
        ranked = rerank_passages(question, PASSAGES, top_k=4)
        rerank_ms = (time.perf_counter() - t1) * 1000

        t2 = time.perf_counter()
        _ = embed_passages([p.text for p in PASSAGES])
        batch_embed_ms = (time.perf_counter() - t2) * 1000

        total_ms = embed_ms + rerank_ms
        runs.append(
            {
                "id": qid,
                "question": question,
                "embed_query_ms": round(embed_ms, 2),
                "rerank_ms": round(rerank_ms, 2),
                "embed_passages_ms": round(batch_embed_ms, 2),
                "total_retrieval_ms": round(total_ms, 2),
                "top_rerank_score": ranked[0].score if ranked else None,
                "abstain_gate_0": (ranked[0].score if ranked else -1) < 0,
            }
        )

    medians = {
        "median_total_retrieval_ms": round(
            sorted(r["total_retrieval_ms"] for r in runs)[len(runs) // 2], 2
        ),
        "median_rerank_ms": round(sorted(r["rerank_ms"] for r in runs)[len(runs) // 2], 2),
    }
    out = {"meta": meta, "medians": medians, "runs": runs}
    print(json.dumps(out, indent=2, ensure_ascii=False))
    out_path = ROOT / "bench" / "cited-chat-eval-latest.json"
    out_path.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
