# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import TypedDict

from docuvate_worker.domain.math_stable import sigmoid
from docuvate_worker.infrastructure.ml.value_types.model import ValueTypeModelBundle


class AmountLineRankerArtifact(TypedDict):
    version: str
    feature_names: list[str]
    coefficients: list[float]
    intercept: float
    min_score: float


_ARTIFACT_PATH = (
    Path(__file__).resolve().parent.parent / "artifacts" / "amount-line-ranker.v1.json"
)


@dataclass(frozen=True)
class AmountLineFeatures:
    money_score: float
    money_minus_identifier: float
    money_minus_date: float
    money_minus_address: float
    money_margin_over_non_money: float
    amount_label_e5_cosine: float
    vat_sum_consistency_hint: float
    label_hint: float
    bottom_line_ratio: float
    thousands_sep_hint: float
    token_length: float

    def as_vector(self) -> list[float]:
        return [
            self.money_score,
            self.money_minus_identifier,
            self.money_minus_date,
            self.money_minus_address,
            self.money_margin_over_non_money,
            self.amount_label_e5_cosine,
            self.vat_sum_consistency_hint,
            self.label_hint,
            self.bottom_line_ratio,
            self.thousands_sep_hint,
            self.token_length,
        ]


@dataclass(frozen=True)
class AmountLineRanker:
    coefficients: tuple[float, ...]
    intercept: float
    min_score: float

    @classmethod
    def from_artifact(cls, payload: AmountLineRankerArtifact) -> AmountLineRanker:
        return cls(
            coefficients=tuple(float(value) for value in payload["coefficients"]),
            intercept=float(payload["intercept"]),
            min_score=float(payload["min_score"]),
        )

    def score(self, features: AmountLineFeatures) -> float:
        vector = features.as_vector()
        if len(vector) != len(self.coefficients):
            return float("-inf")
        linear = self.intercept + sum(
            coef * value for coef, value in zip(self.coefficients, vector, strict=True)
        )
        return sigmoid(linear)


@lru_cache(maxsize=1)
def get_amount_line_ranker() -> AmountLineRanker:
    payload = json.loads(_ARTIFACT_PATH.read_text(encoding="utf-8"))
    return AmountLineRanker.from_artifact(payload)


def _thousands_sep_hint(token: str) -> float:
    if "," not in token and "." not in token:
        return 0.0
    if "," in token and "." in token:
        return 1.0
    if "," in token:
        tail = token.rsplit(",", 1)[-1]
        if len(tail) == 2 and tail.isdigit():  # noqa: PLR2004
            return 1.0
    return 0.0


def build_amount_line_features(
    *,
    bundle: ValueTypeModelBundle,
    token: str,
    line_index: int,
    line_count: int,
    had_explicit_label: bool,
    money_score: float,
    date_score: float,
    money_margin_over_non_money: float = 0.0,
    amount_label_e5_cosine: float = 0.0,
    vat_sum_consistency_hint: float = 0.0,
) -> AmountLineFeatures:
    ident = bundle.log_likelihood(token, "identifier")
    address = bundle.log_likelihood(token, "address")
    denom = max(1, line_count - 1)
    position = line_index / denom
    return AmountLineFeatures(
        money_score=money_score,
        money_minus_identifier=money_score - ident,
        money_minus_date=money_score - date_score,
        money_minus_address=money_score - address,
        money_margin_over_non_money=money_margin_over_non_money,
        amount_label_e5_cosine=amount_label_e5_cosine,
        vat_sum_consistency_hint=vat_sum_consistency_hint,
        label_hint=1.0 if had_explicit_label else 0.0,
        bottom_line_ratio=1.0 - position,
        thousands_sep_hint=_thousands_sep_hint(token),
        token_length=float(len(token)),
    )
