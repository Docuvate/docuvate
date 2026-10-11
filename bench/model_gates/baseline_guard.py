# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Ensure committed baselines are not weakened vs the merge base."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from bench.model_gates.json_models import BaselineDirectionModel
from bench.model_gates.ratchet import metric_direction_for

JUSTIFICATION_PATH = Path(__file__).resolve().parent / "BASELINE_LOWER_JUSTIFICATION.md"


@dataclass(frozen=True)
class BaselineWeakening:
    metric: str
    parent: float
    current: float
    reason: str


def _load_baseline_model(path: Path) -> BaselineDirectionModel:
    return BaselineDirectionModel.model_validate_json(path.read_text(encoding="utf-8"))


def compare_baselines(parent: BaselineDirectionModel, current: BaselineDirectionModel) -> list[BaselineWeakening]:
    violations: list[BaselineWeakening] = []
    for key, parent_value in parent.metrics.items():
        if key not in current.metrics:
            violations.append(
                BaselineWeakening(
                    metric=key,
                    parent=parent_value,
                    current=float("nan"),
                    reason="metric removed from baseline.json",
                )
            )
            continue
        current_value = current.metrics[key]
        direction = parent.metric_direction.get(key, metric_direction_for(key))
        if direction == "higher_is_better":
            if current_value < parent_value:
                violations.append(
                    BaselineWeakening(
                        metric=key,
                        parent=parent_value,
                        current=current_value,
                        reason="floor lowered",
                    )
                )
        elif current_value > parent_value:
            violations.append(
                BaselineWeakening(
                    metric=key,
                    parent=parent_value,
                    current=current_value,
                    reason="ceiling raised",
                )
            )
    return violations


def check_baseline_not_weakened(
    *,
    current_path: Path,
    parent_path: Path,
    allow_lower: bool,
) -> list[BaselineWeakening]:
    if not parent_path.is_file():
        return []
    parent = _load_baseline_model(parent_path)
    current = _load_baseline_model(current_path)
    violations = compare_baselines(parent, current)
    if violations and allow_lower:
        return []
    return violations
