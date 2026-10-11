# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Compare harness metrics against the committed baseline (no silent regressions)."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from bench.model_gates.json_models import BaselineDirectionModel
from bench.model_gates.schema import CommittedBaseline, GateRunResult, HarnessResult

TOLERANCE = 1e-6


@dataclass(frozen=True)
class RatchetViolation:
    metric: str
    measured: float
    baseline: float
    direction: Literal["higher_is_better", "lower_is_better"]


def metric_direction_for(name: str) -> Literal["higher_is_better", "lower_is_better"]:
    if "latency" in name or name.endswith("_ms_max"):
        return "lower_is_better"
    if name.endswith("_regression") or "cross_org_regression" in name:
        return "lower_is_better"
    return "higher_is_better"


def load_baseline(path: Path) -> CommittedBaseline:
    model = BaselineDirectionModel.model_validate_json(path.read_text(encoding="utf-8"))
    directions: dict[str, Literal["higher_is_better", "lower_is_better"]] = dict(
        model.metric_direction
    )
    for key in model.metrics:
        directions.setdefault(key, metric_direction_for(key))
    return CommittedBaseline(version=model.version, metrics=dict(model.metrics), metric_direction=directions)


def flatten_metrics(gates: tuple[GateRunResult, ...]) -> dict[str, float]:
    out: dict[str, float] = {}
    for gate in gates:
        if gate.status != "ok":
            continue
        for metric in gate.metrics:
            out[metric.name] = metric.value
    return out


def compare_to_baseline(
    measured: dict[str, float],
    baseline: CommittedBaseline,
    *,
    only_keys: frozenset[str] | None = None,
) -> list[RatchetViolation]:
    violations: list[RatchetViolation] = []
    for key, floor_or_ceiling in baseline.metrics.items():
        if only_keys is not None and key not in only_keys:
            continue
        if key not in measured:
            violations.append(
                RatchetViolation(
                    metric=key,
                    measured=float("nan"),
                    baseline=floor_or_ceiling,
                    direction=baseline.metric_direction[key],
                )
            )
            continue
        current = measured[key]
        direction = baseline.metric_direction[key]
        if direction == "higher_is_better":
            if current + TOLERANCE < floor_or_ceiling:
                violations.append(
                    RatchetViolation(
                        metric=key,
                        measured=current,
                        baseline=floor_or_ceiling,
                        direction=direction,
                    )
                )
        elif current - TOLERANCE > floor_or_ceiling:
            violations.append(
                RatchetViolation(
                    metric=key,
                    measured=current,
                    baseline=floor_or_ceiling,
                    direction=direction,
                )
            )
    return violations


def harness_measured(result: HarnessResult) -> dict[str, float]:
    return flatten_metrics(result.gates)


def merge_baseline_with_measured(
    baseline: CommittedBaseline,
    measured: dict[str, float],
) -> CommittedBaseline:
    """Raise floors / tighten ceilings when metrics improve (for --update-baseline)."""
    updated: dict[str, float] = dict(baseline.metrics)
    directions: dict[str, Literal["higher_is_better", "lower_is_better"]] = dict(
        baseline.metric_direction
    )
    for key, value in measured.items():
        direction = directions.get(key, metric_direction_for(key))
        directions[key] = direction
        if key not in updated:
            updated[key] = value
            continue
        if direction == "higher_is_better":
            updated[key] = max(updated[key], value)
        else:
            updated[key] = min(updated[key], value)
    return CommittedBaseline(version=baseline.version, metrics=updated, metric_direction=directions)


def write_baseline(path: Path, baseline: CommittedBaseline) -> None:
    model = BaselineDirectionModel(
        version=baseline.version,
        metrics=baseline.metrics,
        metric_direction=baseline.metric_direction,
    )
    path.write_text(model.model_dump_json(indent=2) + "\n", encoding="utf-8")
