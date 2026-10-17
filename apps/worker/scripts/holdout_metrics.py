# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Slot-level metrics and Wilson intervals for synthetic holdout evaluation."""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Callable

FIELD_KEYS = ("vendor", "amount", "date")


@dataclass(frozen=True)
class SlotMetrics:
    precision: float
    recall: float
    coverage: float
    tp: int
    fp: int
    fn: int
    expected_slots: int
    predicted_slots: int
    wilson_precision_low: float
    wilson_precision_high: float
    wilson_recall_low: float
    wilson_recall_high: float


def wilson_interval(successes: int, trials: int, z: float = 1.96) -> tuple[float, float]:
    if trials <= 0:
        return 1.0, 1.0
    p = successes / trials
    denom = 1.0 + z * z / trials
    center = p + z * z / (2.0 * trials)
    margin = z * math.sqrt((p * (1.0 - p) + z * z / (4.0 * trials)) / trials)
    low = (center - margin) / denom
    high = (center + margin) / denom
    return max(0.0, low), min(1.0, high)


def slot_metrics_for_field(
    docs: list[dict[str, object]],
    predict: Callable[[str], dict[str, str]],
    field: str,
) -> SlotMetrics:
    tp = fp = fn = 0
    expected_slots = 0
    predicted_slots = 0
    docs_with_pred = 0
    for doc in docs:
        expected_raw = doc.get("expected")
        expected = expected_raw if isinstance(expected_raw, dict) else {}
        if field in expected:
            expected_slots += 1
        text = str(doc.get("text", ""))
        predicted = predict(text)
        if field in predicted:
            predicted_slots += 1
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
    precision = 1.0 if tp + fp == 0 else tp / (tp + fp)
    recall = 1.0 if tp + fn == 0 else tp / (tp + fn)
    coverage = docs_with_pred / max(1, len(docs))
    p_low, p_high = wilson_interval(tp, tp + fp)
    r_low, r_high = wilson_interval(tp, tp + fn)
    return SlotMetrics(
        precision=precision,
        recall=recall,
        coverage=coverage,
        tp=tp,
        fp=fp,
        fn=fn,
        expected_slots=expected_slots,
        predicted_slots=predicted_slots,
        wilson_precision_low=p_low,
        wilson_precision_high=p_high,
        wilson_recall_low=r_low,
        wilson_recall_high=r_high,
    )
