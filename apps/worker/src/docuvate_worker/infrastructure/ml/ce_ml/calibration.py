# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import TypedDict

_ARTIFACT = (
    Path(__file__).resolve().parent.parent / "artifacts" / "ce-ml-calibration.v1.json"
)


class LabelTierThresholds(TypedDict):
    autoAssignThreshold: float | None
    suggestThreshold: float
    method: str
    autoAssignPrecisionTarget: float | None


class CeMlCalibration(TypedDict):
    version: int
    labelPropagation: dict[str, object]
    fieldSuggestion: dict[str, object]
    missingLabel: dict[str, object]
    zeroInputCluster: dict[str, object]
    openSetFieldDiscovery: dict[str, object]
    attribution: dict[str, str]


@lru_cache(maxsize=1)
def load_ce_ml_calibration() -> CeMlCalibration:
    raw = json.loads(_ARTIFACT.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        msg = "ce-ml-calibration artifact must be a JSON object"
        raise TypeError(msg)
    return raw  # type: ignore[return-value]


def label_tiers(example_count: int) -> LabelTierThresholds:
    cfg = load_ce_ml_calibration()["labelPropagation"]
    if example_count <= 0:
        zero = cfg["zeroExample"]
        return {
            "autoAssignThreshold": zero.get("autoAssignThreshold"),
            "suggestThreshold": float(zero["suggestThreshold"]),
            "method": str(zero.get("method", "ZS")),
            "autoAssignPrecisionTarget": None,
        }
    with_ex = cfg["withExamples"]
    return {
        "autoAssignThreshold": float(with_ex["autoAssignThreshold"]),
        "suggestThreshold": float(with_ex["suggestThreshold"]),
        "method": str(with_ex.get("method", "LP")),
        "autoAssignPrecisionTarget": float(with_ex.get("autoAssignPrecisionTarget", 0.98)),
    }


def field_abstain_threshold() -> float:
    return float(load_ce_ml_calibration()["fieldSuggestion"]["abstainThreshold"])


def missing_label_threshold() -> float:
    return float(load_ce_ml_calibration()["missingLabel"]["threshold"])


def zero_input_cluster_params() -> tuple[float, int, float, float]:
    z = load_ce_ml_calibration()["zeroInputCluster"]
    return (
        float(z["distanceThreshold"]),
        int(z["minClusterSize"]),
        float(z["nameMargin"]),
        float(z["membershipRho"]),
    )
