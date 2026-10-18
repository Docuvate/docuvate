# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from bench.model_gates.ratchet import compare_to_baseline, merge_baseline_with_measured, metric_direction_for
from bench.model_gates.schema import CommittedBaseline


def test_metric_direction_latency_is_lower_better() -> None:
    assert metric_direction_for("chat_extractive.latency_p95_ms") == "lower_is_better"
    assert metric_direction_for("chat_extractive.answer_accuracy") == "higher_is_better"


def test_compare_detects_accuracy_regression() -> None:
    baseline = CommittedBaseline(
        version=1,
        metrics={"chat_extractive.answer_accuracy": 0.9},
        metric_direction={"chat_extractive.answer_accuracy": "higher_is_better"},
    )
    violations = compare_to_baseline({"chat_extractive.answer_accuracy": 0.85}, baseline)
    assert len(violations) == 1


def test_merge_baseline_never_lowers_accuracy_floor() -> None:
    baseline = CommittedBaseline(
        version=1,
        metrics={"chat_extractive.answer_accuracy": 0.9},
        metric_direction={"chat_extractive.answer_accuracy": "higher_is_better"},
    )
    merged = merge_baseline_with_measured(
        baseline,
        {"chat_extractive.answer_accuracy": 0.95},
    )
    assert merged.metrics["chat_extractive.answer_accuracy"] == 0.95
    merged2 = merge_baseline_with_measured(
        merged,
        {"chat_extractive.answer_accuracy": 0.8},
    )
    assert merged2.metrics["chat_extractive.answer_accuracy"] == 0.95
