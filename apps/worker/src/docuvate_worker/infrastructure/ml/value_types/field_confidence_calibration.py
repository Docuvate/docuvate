# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import TypedDict

from docuvate_worker.infrastructure.ml.value_types.promotion_probability_calibrator import (
    get_promotion_probability_calibrators,
)


class _DateFloor(TypedDict):
    min_log_score: float
    confidence: float


class _AmountGate(TypedDict):
    min_ranker_score: float
    min_ranker_margin_over_runner_up: float
    min_calibrated_confidence: float


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
    amount_gate: _AmountGate
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
    amount_min_ranker_score: float
    amount_min_ranker_margin_over_runner_up: float
    amount_min_calibrated_confidence: float

    @classmethod
    def from_artifact(cls, payload: FieldConfidenceArtifact) -> FieldConfidenceCalibration:
        floors = tuple(
            (float(row["min_log_score"]), float(row["confidence"]))
            for row in payload["date_confidence_floors"]
        )
        vendor = payload["vendor_gate"]
        amount = payload.get("amount_gate") or {
            "min_ranker_score": 0.5,
            "min_ranker_margin_over_runner_up": 0.0,
            "min_calibrated_confidence": 0.88,
        }
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
            amount_min_ranker_score=float(amount["min_ranker_score"]),
            amount_min_ranker_margin_over_runner_up=float(
                amount.get("min_ranker_margin_over_runner_up", 0.0)
            ),
            amount_min_calibrated_confidence=float(amount["min_calibrated_confidence"]),
        )

    def amount_promotion_probability(self, ranker_score: float) -> float:
        calibrators = get_promotion_probability_calibrators()
        return calibrators.amount.predict_proba(ranker_score)

    def amount_meets_auto_promote_gate(
        self,
        *,
        ranker_score: float,
        runner_up_ranker_score: float,
        amount_label_e5_cosine: float = 0.0,
        money_margin_over_non_money: float = 0.0,
    ) -> tuple[bool, float]:
        _ = amount_label_e5_cosine
        _ = money_margin_over_non_money
        confidence = self.amount_promotion_probability(ranker_score)
        if ranker_score < self.amount_min_ranker_score:
            return False, confidence
        if ranker_score - runner_up_ranker_score < self.amount_min_ranker_margin_over_runner_up:
            return False, confidence
        return confidence >= self.amount_min_calibrated_confidence, confidence

    def date_confidence_from_log_score(self, raw_score: float) -> float:
        confidence = min(0.95, max(0.45, 0.45 + raw_score * 0.02))
        for min_score, floor in self.date_confidence_floors:
            if raw_score >= min_score:
                confidence = max(confidence, floor)
        return confidence

    def vendor_promotion_probability(
        self,
        *,
        ranker_score: float,
        sender_e5_cosine: float,
        recipient_e5_cosine: float,
        supplier_e5_cosine: float,
        doc_heading_e5_cosine: float,
        label_hint: float,
    ) -> float:
        calibrators = get_promotion_probability_calibrators()
        return calibrators.vendor.predict_proba(
            (
                ranker_score,
                sender_e5_cosine,
                recipient_e5_cosine,
                supplier_e5_cosine,
                doc_heading_e5_cosine,
                label_hint,
            )
        )

    def vendor_meets_auto_promote_gate(
        self,
        *,
        org_score: float,
        free_score: float,
        addr_score: float,
        id_score: float,
        had_explicit_label: bool,
        sender_e5_cosine: float = 0.0,
        ranker_score: float = 0.0,
        recipient_e5_cosine: float = 0.0,
        supplier_e5_cosine: float = 0.0,
        doc_heading_e5_cosine: float = 0.0,
    ) -> tuple[bool, float]:
        e5_boost = 0.0
        if sender_e5_cosine >= self.vendor_min_sender_e5_cosine:
            span = max(1e-6, 1.0 - self.vendor_min_sender_e5_cosine)
            ratio = (sender_e5_cosine - self.vendor_min_sender_e5_cosine) / span
            e5_boost = self.vendor_sender_e5_margin_credit * min(1.0, ratio)
        org_free_margin = org_score - free_score + e5_boost
        sender_e5_ok = sender_e5_cosine >= self.vendor_min_sender_e5_cosine
        if (
            org_free_margin < self.vendor_min_org_margin
            and not had_explicit_label
            and not sender_e5_ok
        ):
            return False, 0.0
        confidence = self.vendor_promotion_probability(
            ranker_score=ranker_score,
            sender_e5_cosine=sender_e5_cosine,
            recipient_e5_cosine=recipient_e5_cosine,
            supplier_e5_cosine=supplier_e5_cosine,
            doc_heading_e5_cosine=doc_heading_e5_cosine,
            label_hint=1.0 if had_explicit_label else 0.0,
        )
        return confidence >= self.vendor_min_calibrated_confidence, confidence


@lru_cache(maxsize=1)
def get_field_confidence_calibration() -> FieldConfidenceCalibration:
    raw = json.loads(_ARTIFACT_PATH.read_text(encoding="utf-8"))
    return FieldConfidenceCalibration.from_artifact(raw)


def auto_promote_min_for_field(field_key: str) -> float:
    cal = get_field_confidence_calibration()
    return cal.auto_promote_min_by_field.get(field_key, 0.9)
