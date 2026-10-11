# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Compare harness metrics against the committed baseline (no silent regressions)."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Literal, cast

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
    return "higher_is_better"


def load_baseline(path: Path) -> CommittedBaseline:
    payload_obj: object = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload_obj, dict):
        raise ValueError("baseline root must be an object")
    payload = cast(dict[str, object], payload_obj)
    version_raw = payload["version"]
    if not isinstance(version_raw, int):
        raise ValueError("baseline.version must be an integer")
    version = version_raw
    metrics_raw = payload.get("metrics")
    if not isinstance(metrics_raw, dict):
        raise ValueError("baseline.metrics must be an object")
    metrics_map = cast(dict[str, object], metrics_raw)
    metrics: dict[str, float] = {}
    for key_obj, raw_obj in metrics_map.items():
        key = str(key_obj)
        if isinstance(raw_obj, (int, float)):
            metrics[key] = float(raw_obj)
        else:
            raise ValueError(f"baseline metric {key} must be numeric")
    directions_raw = payload.get("metric_direction")
    metric_direction: dict[str, Literal["higher_is_better", "lower_is_better"]] = {}
    if isinstance(directions_raw, dict):
        directions_map = cast(dict[str, object], directions_raw)
        for key_obj, raw_obj in directions_map.items():
            key = str(key_obj)
            direction: Literal["higher_is_better", "lower_is_better"]
            if raw_obj == "higher_is_better":
                direction = "higher_is_better"
            elif raw_obj == "lower_is_better":
                direction = "lower_is_better"
            else:
                raise ValueError(f"invalid direction for {key}")
            metric_direction[key] = direction
    for key in metrics:
        metric_direction.setdefault(key, metric_direction_for(key))
    return CommittedBaseline(version=version, metrics=metrics, metric_direction=metric_direction)


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
    payload = {
        "version": baseline.version,
        "metrics": baseline.metrics,
        "metric_direction": baseline.metric_direction,
    }
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


_metric_direction = metric_direction_for
