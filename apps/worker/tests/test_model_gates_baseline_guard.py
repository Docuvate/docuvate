# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from bench.model_gates.baseline_guard import check_baseline_not_weakened, compare_baselines
from bench.model_gates.json_models import BaselineDirectionModel


def test_compare_baselines_detects_lowered_floor() -> None:
    parent = BaselineDirectionModel(
        version=1,
        metrics={"chat_extractive.answer_accuracy": 0.9},
        metric_direction={"chat_extractive.answer_accuracy": "higher_is_better"},
    )
    current = BaselineDirectionModel(
        version=1,
        metrics={"chat_extractive.answer_accuracy": 0.85},
        metric_direction={"chat_extractive.answer_accuracy": "higher_is_better"},
    )
    violations = compare_baselines(parent, current)
    assert len(violations) == 1
    assert violations[0].reason == "floor lowered"


def test_check_allows_lower_with_flag() -> None:
    parent = BaselineDirectionModel(
        version=1,
        metrics={"chat_extractive.latency_p95_ms": 100.0},
        metric_direction={"chat_extractive.latency_p95_ms": "lower_is_better"},
    )
    current = BaselineDirectionModel(
        version=1,
        metrics={"chat_extractive.latency_p95_ms": 200.0},
        metric_direction={"chat_extractive.latency_p95_ms": "lower_is_better"},
    )
    parent_path = Path("/tmp/parent-baseline-guard.json")
    current_path = Path("/tmp/current-baseline-guard.json")
    parent_path.write_text(parent.model_dump_json(), encoding="utf-8")
    current_path.write_text(current.model_dump_json(), encoding="utf-8")
    assert check_baseline_not_weakened(
        current_path=current_path,
        parent_path=parent_path,
        allow_lower=False,
    )
    assert not check_baseline_not_weakened(
        current_path=current_path,
        parent_path=parent_path,
        allow_lower=True,
    )
