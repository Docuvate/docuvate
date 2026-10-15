# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import json
import math
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import TypedDict


class _DateFloor(TypedDict):
    min_log_score: float
    confidence: float


class _VendorGate(TypedDict):
    min_org_margin: float
    min_calibrated_confidence: float
    margin_scale: float
    margin_offset: float


class FieldConfidenceArtifact(TypedDict):
    version: str
    auto_promote_min_by_field: dict[str, float]
    date_confidence_floors: list[_DateFloor]
    vendor_gate: _VendorGate


_ARTIFACT_PATH = (
    Path(__file__).resolve().parent.parent / "artifacts" / "value-types-field-confidence.v1.json"
)


@dataclass(frozen=True)
class FieldConfidenceCalibration:
    auto_promote_min_by_field: dict[str, float]
    date_confidence_floors: tuple[tuple[float, float], ...]
    vendor_min_org_margin: float
    vendor_min_calibrated_confidence: float
    vendor_margin_scale: float
    vendor_margin_offset: float

    @classmethod
    def from_artifact(cls, payload: FieldConfidenceArtifact) -> FieldConfidenceCalibration:
        floors = tuple(
            (float(row["min_log_score"]), float(row["confidence"]))
            for row in payload["date_confidence_floors"]
        )
        vendor = payload["vendor_gate"]
        return cls(
            auto_promote_min_by_field={
                key: float(value) for key, value in payload["auto_promote_min_by_field"].items()
            },
            date_confidence_floors=floors,
            vendor_min_org_margin=float(vendor["min_org_margin"]),
            vendor_min_calibrated_confidence=float(vendor["min_calibrated_confidence"]),
            vendor_margin_scale=float(vendor.get("margin_scale", 0.012)),
            vendor_margin_offset=float(vendor.get("margin_offset", 20.0)),
        )

    def date_confidence_from_log_score(self, raw_score: float) -> float:
        confidence = min(0.95, max(0.45, 0.45 + raw_score * 0.02))
        for min_score, floor in self.date_confidence_floors:
            if raw_score >= min_score:
                confidence = max(confidence, floor)
        return confidence

    def vendor_confidence_from_margin(self, margin: float, *, had_explicit_label: bool) -> float:
        adjusted = margin + (8.0 if had_explicit_label else 0.0)
        linear = 0.45 + max(0.0, adjusted - self.vendor_margin_offset) * self.vendor_margin_scale
        logistic = 1.0 / (1.0 + math.exp(-(adjusted - 38.0) / 6.0))
        blended = 0.25 * linear + 0.75 * logistic
        return min(0.97, max(0.35, blended))

    def vendor_meets_auto_promote_gate(
        self,
        *,
        org_score: float,
        free_score: float,
        addr_score: float,
        id_score: float,
        had_explicit_label: bool,
    ) -> tuple[bool, float]:
        margin = org_score - max(free_score, addr_score, id_score)
        if org_score - free_score < self.vendor_min_org_margin and not had_explicit_label:
            return False, 0.45
        confidence = self.vendor_confidence_from_margin(margin, had_explicit_label=had_explicit_label)
        return confidence >= self.vendor_min_calibrated_confidence, confidence


@lru_cache(maxsize=1)
def get_field_confidence_calibration() -> FieldConfidenceCalibration:
    raw = json.loads(_ARTIFACT_PATH.read_text(encoding="utf-8"))
    return FieldConfidenceCalibration.from_artifact(raw)


def auto_promote_min_for_field(field_key: str) -> float:
    cal = get_field_confidence_calibration()
    return cal.auto_promote_min_by_field.get(field_key, 0.9)
