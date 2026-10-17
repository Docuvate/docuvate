#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Micro eval: global field suggestions (amount/date/vendor) on synthetic holdout."""

from __future__ import annotations

import json
import sys
from collections.abc import Callable
from dataclasses import asdict, dataclass

from docuvate_worker.domain.models import ExtractedField

# Holdout cases: text + expected field keys/values (exact match on normalized value).
HOLDOUT: list[dict[str, object]] = [
    {
        "id": "acme_eur_prefix",
        "text": "Acme GmbH\nRechnung\nEUR 99,00\nDatum 01.02.2024",
        "expected": {"amount": "99.00", "date": "01.02.2024", "vendor": "Acme GmbH"},
    },
    {
        "id": "nordbeispiel_receipt",
        "text": (
            "Rechnung 2024-001\n"
            "Nordbeispiel Beratung GmbH\n"
            "Betrag: 1.240,00 EUR\n"
            "Fälligkeit: 15.03.2024"
        ),
        "expected": {
            "amount": "1240.00",
            "date": "15.03.2024",
            "vendor": "Nordbeispiel Beratung GmbH",
        },
    },
    {
        "id": "absender_label",
        "text": (
            "Rechnung Layout-Workspace Demo\n"
            "Kurzer Absender: Demo Nord GmbH\n"
            "Bruttobetrag: 12.500,00 EUR"
        ),
        "expected": {"amount": "12500.00", "vendor": "Demo Nord GmbH"},
    },
    {
        "id": "landscape_heading_abstain",
        "text": "QUERFORMAT-FIXTURE 842x595\nLandscape-only content row A",
        "expected": {},
    },
    {
        "id": "title_without_vendor_abstain",
        "text": "\n".join(
            [
                "Synthetic Nine Word Academic Title Case Example Heading",
                "Second Line Author Names Only",
            ]
        ),
        "expected": {},
    },
    {
        "id": "acme_after_banner",
        "text": (
            "Synthetic layout regression document with enough words to classify as born digital.\n"
            "Acme GmbH"
        ),
        "expected": {"vendor": "Acme GmbH"},
    },
]


@dataclass(frozen=True)
class EvalRow:
    precision: float
    recall: float
    coverage_rate: float
    tp: int
    fp: int
    fn: int
    expected_slots: int


def evaluate(extract_fn: Callable[[str], list[ExtractedField]]) -> EvalRow:
    tp = fp = fn = 0
    docs_with_any_pred = 0
    for case in HOLDOUT:
        text = str(case["text"])
        expected: dict[str, str] = dict(case["expected"])  # type: ignore[arg-type]
        predicted = {f.key: f.value for f in extract_fn(text)}
        if predicted:
            docs_with_any_pred += 1
        all_keys = set(expected) | set(predicted)
        for key in all_keys:
            exp = expected.get(key)
            pred = predicted.get(key)
            if exp is not None and pred == exp:
                tp += 1
            elif exp is not None and pred != exp:
                fn += 1
                if pred is not None:
                    fp += 1
            elif exp is None and pred is not None:
                fp += 1
    precision = 1.0 if tp + fp == 0 else tp / (tp + fp)
    recall = 1.0 if tp + fn == 0 else tp / (tp + fn)
    coverage_rate = docs_with_any_pred / len(HOLDOUT)
    expected_slots = sum(len(c["expected"]) for c in HOLDOUT)  # type: ignore[arg-type]
    return EvalRow(
        precision=precision,
        recall=recall,
        coverage_rate=coverage_rate,
        tp=tp,
        fp=fp,
        fn=fn,
        expected_slots=expected_slots,
    )


def main() -> int:
    from docuvate_worker.infrastructure.extractors.heuristic_fields import (
        heuristic_field_suggestions,
    )

    learned = evaluate(heuristic_field_suggestions)
    print(json.dumps({"holdout_n": len(HOLDOUT), "learned_ml": asdict(learned)}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
