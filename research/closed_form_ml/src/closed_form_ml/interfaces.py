# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol, runtime_checkable


@dataclass(frozen=True)
class ClassifierResult:
    label_id: str | None
    confidence: float
    rejected: bool
    scores: dict[str, float]


@runtime_checkable
class Classifier(Protocol):
    def fit(self, texts: list[str], label_ids: list[str]) -> None: ...

    def predict(self, text: str) -> ClassifierResult: ...


@dataclass(frozen=True)
class KVPair:
    key_text: str
    value_text: str
    confidence: float


@runtime_checkable
class KVExtractor(Protocol):
    def extract(self, document_text: str, *, entities: list[str] | None = None) -> list[KVPair]: ...


@dataclass(frozen=True)
class RetrievalHit:
    document_id: str
    score: float
    text: str


@runtime_checkable
class Retriever(Protocol):
    def index(self, document_ids: list[str], texts: list[str]) -> None: ...

    def retrieve(self, query: str, *, top_k: int = 5) -> list[RetrievalHit]: ...


@dataclass(frozen=True)
class ReaderSpan:
    text: str
    score: float
    start: int
    end: int


@runtime_checkable
class Reader(Protocol):
    def answer(self, question: str, context: str) -> ReaderSpan | None: ...
