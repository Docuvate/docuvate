# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Typed schemas for model-gate eval results and committed baselines."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

GateStatus = Literal["ok", "stub", "error"]


@dataclass(frozen=True)
class MetricValue:
    """One scalar metric emitted by a gate."""

    name: str
    value: float
    direction: Literal["higher_is_better", "lower_is_better"]


@dataclass(frozen=True)
class GateRunResult:
    gate_id: str
    status: GateStatus
    metrics: tuple[MetricValue, ...]
    detail: str | None = None


@dataclass(frozen=True)
class HarnessResult:
    version: int
    gates: tuple[GateRunResult, ...]


@dataclass(frozen=True)
class BaselineFloor:
    """Minimum acceptable value for higher-is-better metrics."""

    value: float


@dataclass(frozen=True)
class BaselineCeiling:
    """Maximum acceptable value for lower-is-better metrics."""

    value: float


@dataclass(frozen=True)
class CommittedBaseline:
    version: int
    metrics: dict[str, float]
    metric_direction: dict[str, Literal["higher_is_better", "lower_is_better"]]
