#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Generate overlapping German label texts for embedding-density gate."""

from __future__ import annotations

import json
import random
from pathlib import Path

from bench.model_gates.json_models import ClassificationFixturesFile, ClassificationTextExample

OUT = Path(__file__).resolve().parent / "classification_texts.json"
SEED = 20261012

TRAIN_LABELS = [
    "rechnung",
    "vertrag",
    "bescheid",
    "lohnabrechnung",
    "mahnung",
    "lieferschein",
    "bestellung",
    "versicherung",
]
HOLDOUT_LABEL = "werkstattbericht"


def _snippet(rng: random.Random, label: str, idx: int) -> str:
    shared = f"Referenz DE-EVAL-{idx:04d}. "
    templates: dict[str, list[str]] = {
        "rechnung": [
            "Rechnung Nr.",
            "Gesamtsumme inkl. USt.",
            "Zahlbar innerhalb von 14 Tagen.",
        ],
        "mahnung": [
            "Zahlungserinnerung",
            "Mahngebühr",
            "offener Rechnungsbetrag",
        ],
        "vertrag": [
            "Vertragslaufzeit",
            "Kündigungsfrist",
            "Parteien vereinbaren",
        ],
        "bescheid": [
            "Bescheid über",
            "Rechtsbehelfsbelehrung",
            "Festsetzung",
        ],
        "lohnabrechnung": [
            "Bruttoentgelt",
            "Sozialabgaben",
            "Auszahlungsbetrag",
        ],
        "lieferschein": [
            "Lieferung erfolgte",
            "Packstück",
            "Wareneingang",
        ],
        "bestellung": [
            "Bestellnummer",
            "Liefertermin",
            "Bestellmenge",
        ],
        "kuendigung": [
            "Kündigung zum",
            "Vertragsende",
            "Widerruf",
        ],
        "versicherung": [
            "Versicherungsschein",
            "Prämie",
            "Deckung",
        ],
        "kontoauszug": [
            "Kontoauszug",
            "Saldo",
            "Umsätze",
        ],
        "werkstattbericht": [
            "Werkstattbericht",
            "Inspektion",
            "Fahrzeugdiagnose",
        ],
    }
    parts = templates[label]
    body = " ".join(parts[i % len(parts)] for i in range(3))
    if rng.random() < 0.7:
        other = rng.choice(TRAIN_LABELS + [HOLDOUT_LABEL])
        body += " " + rng.choice(templates[other])
    body += " " + rng.choice(
        [
            "Zahlung fällig",
            "Rechnungsbetrag offen",
            "Vertragslaufzeit beachten",
            "Bescheid erhalten",
            "Lieferung dokumentieren",
        ]
    )
    noise = " OCR-Rauschen: l l l " if idx % 7 == 0 else ""
    return shared + body + noise


def generate() -> ClassificationFixturesFile:
    rng = random.Random(SEED)
    examples: list[ClassificationTextExample] = []
    counts = {label: 400 for label in TRAIN_LABELS}
    counts[HOLDOUT_LABEL] = 24
    chunks_per_doc = 1
    for label in TRAIN_LABELS + [HOLDOUT_LABEL]:
        count = counts[label]
        for j in range(count):
            doc_id = f"doc-{label}-{j // chunks_per_doc:03d}"
            examples.append(
                ClassificationTextExample(
                    document_id=doc_id,
                    label_id=label,
                    text=_snippet(rng, label, j),
                )
            )
    return ClassificationFixturesFile(
        version=1,
        seed=SEED,
        provenance="Seeded synthetic German document blurbs with shared vocabulary (licence-clean).",
        label_ids=list(TRAIN_LABELS),
        examples=examples,
    )


def main() -> int:
    payload = generate()
    OUT.write_text(
        json.dumps(payload.model_dump(), indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(payload.examples)} examples to {OUT.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
