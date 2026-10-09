#!/usr/bin/env python3
"""Calibrate RAG reranker gate from DE+EN fixtures (simulated retrieval candidate sets).

Run:
  DOCUVATE_RERANKER_MODEL=BAAI/bge-reranker-v2-m3-int8 python3 bench/rag_gate_calibrate.py

Writes bench/rag-gate-calibration-scores.json (committed).
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "worker" / "src"))

from docuvate_worker.infrastructure.chat.rag_rerank import RagPassage, rerank_passages

CHUNKS = {
    "de-invoice": "Rechnung Nordwind GmbH\nGesamtsumme: 1.234,56 EUR\nIBAN DE89370400440532013000",
    "de-rent": "Mietvertrag Wohnung\nDie Miete ist bis zum 3. Werktag des Monats fällig.",
    "de-notice": "Arbeitsvertrag\nDie Kündigungsfrist beträgt drei Monate zum Quartalsende.",
    "de-tax": "Bescheid Hundesteuer Stadt Muster\nJahresgebühr: 120,00 EUR",
}

DISTRACTOR_SET = ["de-invoice", "de-rent", "de-notice", "de-tax"]


def candidate_passages(primary_id: str) -> list[RagPassage]:
    ids = [primary_id] + [i for i in DISTRACTOR_SET if i != primary_id]
    return [RagPassage(id=i, text=CHUNKS[i]) for i in ids[:4]]


CASES: list[dict[str, object]] = [
    {
        "id": "de-invoice-total",
        "kind": "in_domain",
        "question": "Welche Gesamtsumme steht auf der Rechnung Nordwind?",
        "passages": candidate_passages("de-invoice"),
    },
    {
        "id": "de-rent-due",
        "kind": "in_domain",
        "question": "Bis wann ist die Miete fällig?",
        "passages": candidate_passages("de-rent"),
    },
    {
        "id": "de-notice-period",
        "kind": "in_domain",
        "question": "Welche Kündigungsfrist gilt im Vertrag?",
        "passages": candidate_passages("de-notice"),
    },
    {
        "id": "de-tax-fee",
        "kind": "in_domain",
        "question": "Was kostet die Hundesteuer?",
        "passages": candidate_passages("de-tax"),
    },
    {
        "id": "de-iban",
        "kind": "in_domain",
        "question": "Welche IBAN hat der Absender?",
        "passages": candidate_passages("de-invoice"),
    },
    {
        "id": "de-rent-wording",
        "kind": "in_domain",
        "question": "Wann muss die Miete bezahlt werden?",
        "passages": candidate_passages("de-rent"),
    },
    {
        "id": "de-invoice-vendor",
        "kind": "in_domain",
        "question": "Wer hat die Rechnung ausgestellt?",
        "passages": candidate_passages("de-invoice"),
    },
    {
        "id": "de-notice-end",
        "kind": "in_domain",
        "question": "Bis wann kann gekündigt werden?",
        "passages": candidate_passages("de-notice"),
    },
    {
        "id": "de-tax-city",
        "kind": "in_domain",
        "question": "Welche Jahresgebühr gilt für die Hundesteuer?",
        "passages": candidate_passages("de-tax"),
    },
    {
        "id": "de-invoice-currency",
        "kind": "in_domain",
        "question": "Welcher Betrag steht auf der Rechnung in EUR?",
        "passages": candidate_passages("de-invoice"),
    },
    {
        "id": "de-off-topic-weather",
        "kind": "off_topic",
        "question": "Wie wird das Wetter morgen in Berlin?",
        "passages": [RagPassage(id=i, text=CHUNKS[i]) for i in DISTRACTOR_SET],
    },
    {
        "id": "en-off-topic",
        "kind": "off_topic",
        "question": "What is the capital of France?",
        "passages": [RagPassage(id=i, text=CHUNKS[i]) for i in DISTRACTOR_SET],
    },
    {
        "id": "de-off-topic-sports",
        "kind": "off_topic",
        "question": "Wer gewann die Fußball-WM 2022?",
        "passages": [RagPassage(id=i, text=CHUNKS[i]) for i in DISTRACTOR_SET],
    },
    {
        "id": "de-off-topic-crypto",
        "kind": "off_topic",
        "question": "Wie hoch ist der Bitcoin-Preis heute?",
        "passages": [RagPassage(id=i, text=CHUNKS[i]) for i in DISTRACTOR_SET],
    },
    {
        "id": "en-off-topic-stocks",
        "kind": "off_topic",
        "question": "How did the NASDAQ close yesterday?",
        "passages": [RagPassage(id=i, text=CHUNKS[i]) for i in DISTRACTOR_SET],
    },
]


def main() -> int:
    model = os.environ.get("DOCUVATE_RERANKER_MODEL", "BAAI/bge-reranker-v2-m3-int8")
    runs: list[dict[str, object]] = []
    for case in CASES:
        passages: list[RagPassage] = case["passages"]  # type: ignore[assignment]
        ranked, used = rerank_passages(str(case["question"]), passages, top_k=len(passages))
        top = ranked[0] if ranked else None
        runs.append(
            {
                "id": case["id"],
                "kind": case["kind"],
                "question": case["question"],
                "top_passage_id": top.id if top else None,
                "score": round(float(top.score), 4) if top else None,
                "reranker_used": used,
            }
        )

    in_scores = [float(r["score"]) for r in runs if r["kind"] == "in_domain" and r["score"] is not None]
    off_scores = [float(r["score"]) for r in runs if r["kind"] == "off_topic" and r["score"] is not None]
    min_in = min(in_scores) if in_scores else None
    max_off = max(off_scores) if off_scores else None
    suggested = None
    if min_in is not None and max_off is not None and min_in > max_off:
        suggested = round((min_in + max_off) / 2, 4)

    out = {
        "model": model,
        "min_in_domain": min_in,
        "max_off_topic": max_off,
        "suggested_gate_midpoint": suggested,
        "runs": runs,
    }
    out_path = ROOT / "bench" / "rag-gate-calibration-scores.json"
    out_path.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(out, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
