# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Literal, TypedDict


class ValueTypeCounts(TypedDict):
    total: int
    ngrams: dict[str, int]


class ValueTypeArtifactPayload(TypedDict):
    version: str
    order: int
    smoothing: float
    types: dict[str, ValueTypeCounts]
    vocab_size: int


ValueTypeName = Literal["money", "date", "organization", "identifier", "address", "free_text"]

VALUE_TYPE_NAMES: tuple[ValueTypeName, ...] = (
    "money",
    "date",
    "organization",
    "identifier",
    "address",
    "free_text",
)


def char_ngrams(text: str, order: int) -> list[str]:
    normalized = text.strip().lower()
    if not normalized:
        return []
    pad = "^" * (order - 1)
    tail = "$" * (order - 1)
    padded = f"{pad}{normalized}{tail}"
    return [padded[i : i + order] for i in range(len(padded) - order + 1)]


@dataclass(frozen=True)
class ValueTypeModelBundle:
    version: str
    order: int
    smoothing: float
    vocab_size: int
    type_counts: dict[str, ValueTypeCounts]

    @classmethod
    def from_payload(cls, payload: ValueTypeArtifactPayload) -> ValueTypeModelBundle:
        return cls(
            version=payload["version"],
            order=int(payload["order"]),
            smoothing=float(payload["smoothing"]),
            vocab_size=int(payload["vocab_size"]),
            type_counts=dict(payload["types"]),
        )

    @classmethod
    def load_json(cls, path: Path) -> ValueTypeModelBundle:
        raw = json.loads(path.read_text(encoding="utf-8"))
        return cls.from_payload(raw)

    def log_likelihood(self, text: str, type_name: str) -> float:
        counts = self.type_counts.get(type_name)
        if counts is None:
            return float("-inf")
        total = counts["total"]
        if total <= 0:
            return float("-inf")
        ngram_map = counts["ngrams"]
        grams = char_ngrams(text, self.order)
        if not grams:
            return float("-inf")
        denom = total + self.smoothing * self.vocab_size
        log_prob = 0.0
        for gram in grams:
            observed = ngram_map.get(gram, 0)
            log_prob += math.log(observed + self.smoothing) - math.log(denom)
        return log_prob

    def best_type(self, text: str) -> tuple[str, float]:
        best_name = "free_text"
        best_score = float("-inf")
        for type_name in self.type_counts:
            score = self.log_likelihood(text, type_name)
            if score > best_score:
                best_score = score
                best_name = type_name
        return best_name, best_score

    def type_scores(self, text: str) -> dict[str, float]:
        return {name: self.log_likelihood(text, name) for name in self.type_counts}
