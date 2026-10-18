#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Embed generic DE/EN chat intent seed phrases; write prototype JSON for API routing."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "apps" / "worker" / "src"))

from docuvate_worker.infrastructure.fastembed_model import embed_query

OUT_API = (
    ROOT / "apps/api/src/modules/cited-chat/domain/chat-intent-prototypes.json"
)
OUT_STATS = (
    ROOT / "apps/api/src/modules/cited-chat/domain/chat-stats-operation-prototypes.json"
)

SEED_PHRASES: dict[str, list[str]] = {
    "document_qa": [
        "Was steht in meinem Vertrag zur Kündigungsfrist?",
        "Wie hoch ist der Rechnungsbetrag auf dem Dokument?",
        "Welche IBAN ist angegeben?",
        "When is the rent due according to the lease?",
        "What is the total amount on this invoice?",
        "Nenne mir die Jahresgebühr aus dem Bescheid.",
    ],
    "stats": [
        "Wie viele Dokumente habe ich insgesamt?",
        "Wie viele Entgeltnachweise liegen in meiner Bibliothek?",
        "How many documents are in my library?",
        "Wie viele Rechnungen habe ich?",
        "Liste meine Verträge auf.",
        "Liste alle Verträge in meiner Bibliothek.",
        "Welche Dokumente haben das Label Versicherung?",
        "Wie viele fertigen Dokumente gibt es?",
        "Zeige mir alle Dokumente mit einem bestimmten Label.",
    ],
    "smalltalk": [
        "Hallo, wie geht es dir?",
        "Danke für die Hilfe!",
        "Guten Morgen.",
        "hi",
        "Hello",
        "hey",
        "Hello, nice to meet you.",
        "Thanks a lot!",
    ],
    "out_of_scope": [
        "Wie wird das Wetter morgen?",
        "Schreib mir ein Gedicht über den Mond.",
        "What is the capital of France?",
        "Erkläre mir Quantenphysik ohne Bezug zu Dokumenten.",
        "Wer gewann die Fußball-Weltmeisterschaft?",
        "Wer gewann die Fußball-WM?",
        "Wie koche ich Spaghetti?",
    ],
}

STATS_OPS: dict[str, list[str]] = {
    "count_total": [
        "Wie viele Dokumente habe ich?",
        "How many documents do I have?",
        "Gesamtzahl der Dokumente in der Bibliothek",
    ],
    "count_ready": [
        "Wie viele Dokumente sind fertig verarbeitet?",
        "How many documents are ready?",
        "Anzahl fertiger Dokumente",
    ],
    "count_by_label": [
        "Wie viele Entgeltnachweise habe ich?",
        "How many invoices are tagged?",
        "Anzahl Dokumente mit einem bestimmten Label",
    ],
    "list_by_label": [
        "Liste alle Verträge auf.",
        "Show documents with this label",
        "Welche Dokumente haben dieses Label?",
    ],
}


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
    intents = {name: _centroid(texts) for name, texts in SEED_PHRASES.items()}
    stats_ops = {name: _centroid(texts) for name, texts in STATS_OPS.items()}

    intent_payload = {
        "version": 1,
        "encoder": "intfloat/multilingual-e5-small",
        "encoder_revision": "614241f622f53c4eeff9890bdc4f31cfecc418b3-onnx-int8",
        "intents": intents,
        "min_score": 0.74,
        "min_margin": 0.04,
        "default_intent": "document_qa",
    }
    stats_payload = {
        "version": 1,
        "encoder": "intfloat/multilingual-e5-small",
        "operations": stats_ops,
        "min_score": 0.72,
        "min_margin": 0.03,
        "default_operation": "count_total",
    }
    OUT_API.write_text(json.dumps(intent_payload, ensure_ascii=False), encoding="utf-8")
    OUT_STATS.write_text(json.dumps(stats_payload, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {OUT_API} and {OUT_STATS}")


if __name__ == "__main__":
    main()
