#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Generate eval/chat_de/test.json (routing labels, no fixture document text)."""

from __future__ import annotations

import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "eval" / "chat_de" / "test.json"
SEED = 20261012

ROUTE_SEEDS: dict[str, list[str]] = {
    "document_qa": [
        "Was steht im Vertrag zur Kündigung?",
        "Wie hoch ist die Rechnungssumme?",
        "Nenne die IBAN aus dem Schreiben.",
    ],
    "stats": [
        "Wie viele Dokumente habe ich?",
        "Wie viele Entgeltnachweise sind vorhanden?",
        "Liste alle Verträge in meiner Bibliothek.",
    ],
    "smalltalk": ["Hallo!", "Danke!", "Guten Tag."],
    "out_of_scope": ["Wie wird das Wetter?", "Wer gewann die Fußball-WM?"],
}

FOLLOW_UPS = [
    ("Wie viele Rechnungen habe ich?", "Und aus dem Jahr 2024?"),
    ("Welche Kündigungsfrist gilt?", "Gilt das auch für Mieter?"),
]


def main() -> None:
    rng = random.Random(SEED)
    cases: list[dict[str, object]] = []
    idx = 0
    for route, phrases in ROUTE_SEEDS.items():
        for _ in range(35):
            q = rng.choice(phrases)
            cases.append(
                {
                    "id": f"route-{idx}",
                    "question": q,
                    "prior_user": None,
                    "expected_route": route,
                }
            )
            idx += 1
    for prior, follow in FOLLOW_UPS:
        for _ in range(5):
            cases.append(
                {
                    "id": f"follow-{idx}",
                    "question": follow,
                    "prior_user": prior,
                    "expected_route": "document_qa",
                    "expect_resolved_contains": prior.split()[:3],
                }
            )
            idx += 1
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {
                "version": 1,
                "seed": SEED,
                "provenance": "synthetic routing phrases (no customer documents)",
                "cases": cases,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Wrote {len(cases)} cases to {OUT}")


if __name__ == "__main__":
    main()
