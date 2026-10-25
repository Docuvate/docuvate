# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import NotRequired, TypedDict, cast

_ARTIFACT = (
    Path(__file__).resolve().parent.parent / "artifacts" / "ce-ml-calibration.v1.json"
)


class LabelTierThresholds(TypedDict):
    autoAssignThreshold: float | None
    suggestThreshold: float
    method: str
    autoAssignPrecisionTarget: float | None


class LabelPropagationTier(TypedDict, total=False):
    autoAssignThreshold: float | None
    suggestThreshold: float
    method: str
    autoAssignPrecisionTarget: float


class LabelPropagationConfig(TypedDict):
    zeroExample: LabelPropagationTier
    withExamples: LabelPropagationTier
    minCalibrationDocuments: NotRequired[int]


class FieldSuggestionConfig(TypedDict):
    abstainThreshold: float


class MissingLabelConfig(TypedDict):
    threshold: float


class ZeroInputClusterConfig(TypedDict):
    distanceThreshold: float
    minClusterSize: int
    nameMargin: float
    membershipRho: float


class OpenSetFieldDiscoveryConfig(TypedDict):
    keyClusterTau: float
    minDocFrequencyPhi: float
    keylessClusterTau2: float


class CeMlCalibration(TypedDict):
    version: int
    labelPropagation: LabelPropagationConfig
    fieldSuggestion: FieldSuggestionConfig
    missingLabel: MissingLabelConfig
    zeroInputCluster: ZeroInputClusterConfig
    openSetFieldDiscovery: OpenSetFieldDiscoveryConfig
    attribution: dict[str, str]


def _require_mapping(value: object, label: str) -> dict[str, object]:
    if not isinstance(value, dict):
        msg = f"{label} must be a JSON object"
        raise TypeError(msg)
    return value


@lru_cache(maxsize=1)
def load_ce_ml_calibration() -> CeMlCalibration:
    raw = json.loads(_ARTIFACT.read_text(encoding="utf-8"))
    root = _require_mapping(raw, "ce-ml-calibration artifact")
    return cast(CeMlCalibration, root)


def label_tiers(example_count: int) -> LabelTierThresholds:
    cfg = load_ce_ml_calibration()["labelPropagation"]
    if example_count <= 0:
        zero: LabelPropagationTier = cfg["zeroExample"]
        suggest = zero.get("suggestThreshold")
        if suggest is None:
            msg = "labelPropagation.zeroExample.suggestThreshold is required"
            raise ValueError(msg)
        return {
            "autoAssignThreshold": zero.get("autoAssignThreshold"),
            "suggestThreshold": float(suggest),
            "method": str(zero.get("method", "ZS")),
            "autoAssignPrecisionTarget": None,
        }
    with_ex: LabelPropagationTier = cfg["withExamples"]
    auto = with_ex.get("autoAssignThreshold")
    suggest = with_ex.get("suggestThreshold")
    if auto is None or suggest is None:
        msg = "labelPropagation.withExamples thresholds are required"
        raise ValueError(msg)
    return {
        "autoAssignThreshold": float(auto),
        "suggestThreshold": float(suggest),
        "method": str(with_ex.get("method", "LP")),
        "autoAssignPrecisionTarget": float(with_ex.get("autoAssignPrecisionTarget", 0.98)),
    }


def label_propagation_min_calibration_docs() -> int:
    raw = load_ce_ml_calibration()["labelPropagation"].get("minCalibrationDocuments", 8)
    return int(raw)


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
