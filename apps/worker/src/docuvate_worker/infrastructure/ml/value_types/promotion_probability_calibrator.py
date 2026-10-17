# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import json
import math
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Literal, TypedDict


class _PlattPayload(TypedDict):
    method: Literal["platt"]
    feature_names: list[str]
    coefficients: list[float]
    intercept: float


class _IsotonicPayload(TypedDict):
    method: Literal["isotonic"]
    x: list[float]
    y: list[float]


class PromotionCalibratorsArtifact(TypedDict, total=False):
    version: str
    vendor: _PlattPayload
    amount: _IsotonicPayload


_ARTIFACT_PATH = (
    Path(__file__).resolve().parent.parent
    / "artifacts"
    / "field-promotion-calibrators.v1.json"
)


@dataclass(frozen=True)
class PlattCalibrator:
    coefficients: tuple[float, ...]
    intercept: float

    def predict_proba(self, features: tuple[float, ...]) -> float:
        if len(features) != len(self.coefficients):
            return 0.0
        linear = self.intercept + sum(
            coef * value for coef, value in zip(self.coefficients, features, strict=True)
        )
        return 1.0 / (1.0 + math.exp(-linear))


@dataclass(frozen=True)
class IsotonicCalibrator:
    x: tuple[float, ...]
    y: tuple[float, ...]

    def predict_proba(self, score: float) -> float:
        xs, ys = self.x, self.y
        if not xs:
            return max(0.0, min(1.0, score))
        if score <= xs[0]:
            return ys[0]
        if score >= xs[-1]:
            return ys[-1]
        for index in range(len(xs) - 1):
            left, right = xs[index], xs[index + 1]
            if left <= score <= right:
                span = right - left
                if span <= 1e-12:  # noqa: PLR2004
                    return ys[index + 1]
                ratio = (score - left) / span
                return ys[index] + ratio * (ys[index + 1] - ys[index])
        return ys[-1]


@dataclass(frozen=True)
class PromotionProbabilityCalibrators:
    vendor: PlattCalibrator
    amount: IsotonicCalibrator


@lru_cache(maxsize=1)
def get_promotion_probability_calibrators() -> PromotionProbabilityCalibrators:
    payload = json.loads(_ARTIFACT_PATH.read_text(encoding="utf-8"))
    vendor_raw = payload["vendor"]
    amount_raw = payload["amount"]
    return PromotionProbabilityCalibrators(
        vendor=PlattCalibrator(
            coefficients=tuple(float(v) for v in vendor_raw["coefficients"]),
            intercept=float(vendor_raw["intercept"]),
        ),
        amount=IsotonicCalibrator(
            x=tuple(float(v) for v in amount_raw["x"]),
            y=tuple(float(v) for v in amount_raw["y"]),
        ),
    )
