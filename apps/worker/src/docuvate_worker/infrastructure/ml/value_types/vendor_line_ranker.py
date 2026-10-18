# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import json
import math
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import TypedDict

from docuvate_worker.infrastructure.ml.value_types.model import ValueTypeModelBundle
from docuvate_worker.infrastructure.ml.value_types.vendor_document_layout import (
    cross_block_supplier_agreement,
    footer_band_ratio,
    iban_holder_adjacency_hint,
    letterhead_band_ratio,
)


class VendorLineRankerArtifact(TypedDict):
    version: str
    feature_names: list[str]
    coefficients: list[float]
    intercept: float
    min_score: float
    min_score_labeled_sender_e5: float


_ARTIFACT_PATH = (
    Path(__file__).resolve().parent.parent / "artifacts" / "vendor-line-ranker.v1.json"
)


@dataclass(frozen=True)
class VendorLineFeatures:
    sender_e5_cosine: float
    org_minus_free: float
    org_minus_alt: float
    money_minus_org: float
    label_hint: float
    line_position_ratio: float
    top_of_page_hint: float
    first_label_line_offset: float
    recipient_e5_cosine: float
    supplier_e5_cosine: float
    doc_heading_e5_cosine: float
    supplier_minus_recipient_e5: float
    letterhead_band_hint: float
    footer_band_hint: float
    cross_block_supplier_e5: float
    iban_holder_adjacency: float
    labeled_recipient_e5: float
    doc_heading_minus_supplier_e5: float
    letterhead_supplier_interaction: float
    digits_ratio: float
    addr_minus_org: float
    doc_heading_low_org_margin: float
    labeled_recipient_over_supplier: float
    letterhead_org_margin: float

    def as_vector(self) -> list[float]:
        return [
            self.sender_e5_cosine,
            self.org_minus_free,
            self.org_minus_alt,
            self.money_minus_org,
            self.label_hint,
            self.line_position_ratio,
            self.top_of_page_hint,
            self.first_label_line_offset,
            self.recipient_e5_cosine,
            self.supplier_e5_cosine,
            self.doc_heading_e5_cosine,
            self.supplier_minus_recipient_e5,
            self.letterhead_band_hint,
            self.footer_band_hint,
            self.cross_block_supplier_e5,
            self.iban_holder_adjacency,
            self.labeled_recipient_e5,
            self.doc_heading_minus_supplier_e5,
            self.letterhead_supplier_interaction,
            self.digits_ratio,
            self.addr_minus_org,
            self.doc_heading_low_org_margin,
            self.labeled_recipient_over_supplier,
            self.letterhead_org_margin,
        ]


@dataclass(frozen=True)
class VendorLineRanker:
    coefficients: tuple[float, ...]
    intercept: float
    min_score: float
    min_score_labeled_sender_e5: float

    @classmethod
    def from_artifact(cls, payload: VendorLineRankerArtifact) -> VendorLineRanker:
        default_min = float(payload["min_score"])
        return cls(
            coefficients=tuple(float(value) for value in payload["coefficients"]),
            intercept=float(payload["intercept"]),
            min_score=default_min,
            min_score_labeled_sender_e5=float(
                payload.get("min_score_labeled_sender_e5", default_min)
            ),
        )

    def min_score_for(
        self,
        *,
        had_explicit_label: bool,
        sender_e5_cosine: float,
        sender_e5_floor: float,
    ) -> float:
        if had_explicit_label and sender_e5_cosine + 1e-9 >= sender_e5_floor:
            return self.min_score_labeled_sender_e5
        return self.min_score

    def score(self, features: VendorLineFeatures) -> float:
        vector = features.as_vector()
        if len(vector) != len(self.coefficients):
            return float("-inf")
        linear = self.intercept + sum(
            coef * value for coef, value in zip(self.coefficients, vector, strict=True)
        )
        return 1.0 / (1.0 + math.exp(-linear))


@lru_cache(maxsize=1)
def get_vendor_line_ranker() -> VendorLineRanker:
    payload = json.loads(_ARTIFACT_PATH.read_text(encoding="utf-8"))
    return VendorLineRanker.from_artifact(payload)


def build_line_features(  # noqa: PLR0913
    *,
    bundle: ValueTypeModelBundle,
    lines: list[str],
    candidate: str,
    line_index: int,
    line_count: int,
    sender_e5_cosine: float,
    had_explicit_label: bool,
    first_label_line_index: int | None = None,
    recipient_e5_cosine: float = 0.0,
    supplier_e5_cosine: float = 0.0,
    doc_heading_e5_cosine: float = 0.0,
    supplier_cosines: list[float] | None = None,
    digits_ratio: float = 0.0,
) -> VendorLineFeatures:
    org = bundle.log_likelihood(candidate, "organization")
    free = bundle.log_likelihood(candidate, "free_text")
    addr = bundle.log_likelihood(candidate, "address")
    ident = bundle.log_likelihood(candidate, "identifier")
    money = bundle.log_likelihood(candidate, "money")
    denom = max(1, line_count - 1)
    return VendorLineFeatures(
        sender_e5_cosine=sender_e5_cosine,
        org_minus_free=org - free,
        org_minus_alt=org - max(free, addr, ident),
        money_minus_org=money - org,
        label_hint=1.0 if had_explicit_label else 0.0,
        line_position_ratio=line_index / denom,
        top_of_page_hint=1.0 if line_index == 0 else 0.0,
        first_label_line_offset=float(
            max(0, line_index - first_label_line_index)
            if first_label_line_index is not None and had_explicit_label
            else 0.0
        ),
        recipient_e5_cosine=recipient_e5_cosine,
        supplier_e5_cosine=supplier_e5_cosine,
        doc_heading_e5_cosine=doc_heading_e5_cosine,
        supplier_minus_recipient_e5=supplier_e5_cosine - recipient_e5_cosine,
        letterhead_band_hint=letterhead_band_ratio(line_index, line_count),
        footer_band_hint=footer_band_ratio(line_index, line_count),
        cross_block_supplier_e5=cross_block_supplier_agreement(
            lines=lines,
            line_index=line_index,
            supplier_cosines=supplier_cosines
            if supplier_cosines is not None
            else [0.0] * len(lines),
            bundle=bundle,
        ),
        iban_holder_adjacency=iban_holder_adjacency_hint(
            lines=lines,
            line_index=line_index,
            bundle=bundle,
        ),
        labeled_recipient_e5=recipient_e5_cosine if had_explicit_label else 0.0,
        doc_heading_minus_supplier_e5=doc_heading_e5_cosine - supplier_e5_cosine,
        letterhead_supplier_interaction=letterhead_band_ratio(line_index, line_count)
        * supplier_e5_cosine,
        digits_ratio=digits_ratio,
        addr_minus_org=addr - org,
        doc_heading_low_org_margin=doc_heading_e5_cosine
        * max(0.0, 25.0 - (org - free)),
        labeled_recipient_over_supplier=(
            max(0.0, recipient_e5_cosine - supplier_e5_cosine - 0.05)
            if had_explicit_label
            else 0.0
        ),
        letterhead_org_margin=letterhead_band_ratio(line_index, line_count) * (org - free),
    )
