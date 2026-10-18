#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Evaluate global field suggestions on synthetic holdout (eval split)."""

from __future__ import annotations

import json
import sys
from dataclasses import asdict, dataclass
from pathlib import Path

from docuvate_worker.infrastructure.ml.value_types.field_suggestions import (
    learned_field_suggestions,
)

REPO_ROOT = Path(__file__).resolve().parents[3]
HOLDOUT_PATH = REPO_ROOT / "apps/worker/tests/fixtures/global_field_holdout.v1.json"
REGEX_BASELINE_PATH = (
    REPO_ROOT / "apps/worker/tests/fixtures/global_field_holdout_regex_baseline.v1.json"
)

FIELD_KEYS = ("vendor", "amount", "date")


@dataclass(frozen=True)
class FieldMetrics:
    precision: float
    recall: float
    coverage: float
    tp: int
    fp: int
    fn: int
    expected_slots: int


def _load_eval_docs() -> list[dict[str, object]]:
    payload = json.loads(HOLDOUT_PATH.read_text(encoding="utf-8"))
    return [
        doc
        for doc in payload["documents"]
        if isinstance(doc, dict) and doc.get("split") == "eval"
    ]


def _regex_predictions(docs: list[dict[str, object]]) -> list[dict[str, str]]:
    baseline = json.loads(REGEX_BASELINE_PATH.read_text(encoding="utf-8"))
    by_id = {
        str(row["id"]): dict(row.get("predicted", {}))
        for row in baseline.get("predictions", [])
        if isinstance(row, dict)
    }
    return [by_id.get(str(doc.get("id", "")), {}) for doc in docs]


def _field_metrics(
    docs: list[dict[str, object]],
    predicted_rows: list[dict[str, str]],
) -> dict[str, FieldMetrics]:
    out: dict[str, FieldMetrics] = {}
    for field in FIELD_KEYS:
        tp = fp = fn = expected_slots = 0
        docs_with_pred = 0
        for doc, predicted in zip(docs, predicted_rows, strict=True):
            expected_raw = doc.get("expected")
            expected = expected_raw if isinstance(expected_raw, dict) else {}
            if field in expected:
                expected_slots += 1
            if field in predicted:
                docs_with_pred += 1
            if field in expected:
                if predicted.get(field) == expected[field]:
                    tp += 1
                else:
                    fn += 1
                    if field in predicted:
                        fp += 1
            elif field in predicted:
                fp += 1
        out[field] = FieldMetrics(
            precision=1.0 if tp + fp == 0 else tp / (tp + fp),
            recall=1.0 if tp + fn == 0 else tp / (tp + fn),
            coverage=docs_with_pred / max(1, len(docs)),
            tp=tp,
            fp=fp,
            fn=fn,
            expected_slots=expected_slots,
        )
    return out


def main() -> int:
    if not HOLDOUT_PATH.is_file():
        raise SystemExit(f"Missing holdout fixture: {HOLDOUT_PATH}")
    if not REGEX_BASELINE_PATH.is_file():
        raise SystemExit(f"Missing regex baseline fixture: {REGEX_BASELINE_PATH}")

    eval_docs = _load_eval_docs()
    ml_rows = [
        {field.key: field.value for field in learned_field_suggestions(str(doc.get("text", "")))}
        for doc in eval_docs
    ]
    regex_rows = _regex_predictions(eval_docs)
    payload = {
        "holdout_version": 1,
        "eval_doc_count": len(eval_docs),
        "before_regex_baseline": {
            field: asdict(metrics)
            for field, metrics in _field_metrics(eval_docs, regex_rows).items()
        },
        "after_ml_pipeline": {
            field: asdict(metrics)
            for field, metrics in _field_metrics(eval_docs, ml_rows).items()
        },
    }
    print(json.dumps(payload, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
