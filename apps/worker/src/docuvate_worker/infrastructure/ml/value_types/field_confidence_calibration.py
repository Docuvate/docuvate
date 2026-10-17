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
    min_sender_e5_cosine: float
    sender_e5_margin_credit: float


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
    vendor_min_sender_e5_cosine: float
    vendor_sender_e5_margin_credit: float

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
            vendor_min_sender_e5_cosine=float(vendor.get("min_sender_e5_cosine", 0.84)),
            vendor_sender_e5_margin_credit=float(vendor.get("sender_e5_margin_credit", 12.0)),
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

    def _sender_e5_margin_boost(self, sender_e5_cosine: float) -> float:
        if sender_e5_cosine < self.vendor_min_sender_e5_cosine:
            return 0.0
        span = max(1e-6, 1.0 - self.vendor_min_sender_e5_cosine)
        ratio = (sender_e5_cosine - self.vendor_min_sender_e5_cosine) / span
        return self.vendor_sender_e5_margin_credit * min(1.0, ratio)

    def vendor_meets_auto_promote_gate(
        self,
        *,
        org_score: float,
        free_score: float,
        addr_score: float,
        id_score: float,
        had_explicit_label: bool,
        sender_e5_cosine: float = 0.0,
    ) -> tuple[bool, float]:
        margin = org_score - max(free_score, addr_score, id_score)
        e5_boost = self._sender_e5_margin_boost(sender_e5_cosine)
        org_free_margin = org_score - free_score + e5_boost
        sender_e5_ok = sender_e5_cosine >= self.vendor_min_sender_e5_cosine
        if (
            org_free_margin < self.vendor_min_org_margin
            and not had_explicit_label
            and not sender_e5_ok
        ):
            return False, 0.45
        confidence = self.vendor_confidence_from_margin(
            margin + e5_boost,
            had_explicit_label=had_explicit_label,
        )
        if sender_e5_ok:
            span = max(1e-6, 1.0 - self.vendor_min_sender_e5_cosine)
            e5_ratio = min(1.0, (sender_e5_cosine - self.vendor_min_sender_e5_cosine) / span)
            org_free = org_score - free_score
            confidence = min(
                0.97,
                max(
                    confidence,
                    0.45 + e5_ratio * 0.42 + max(0.0, org_free) * 0.004,
                ),
            )
        return confidence >= self.vendor_min_calibrated_confidence, confidence


@lru_cache(maxsize=1)
def get_field_confidence_calibration() -> FieldConfidenceCalibration:
    raw = json.loads(_ARTIFACT_PATH.read_text(encoding="utf-8"))
    return FieldConfidenceCalibration.from_artifact(raw)


def auto_promote_min_for_field(field_key: str) -> float:
    cal = get_field_confidence_calibration()
    return cal.auto_promote_min_by_field.get(field_key, 0.9)
