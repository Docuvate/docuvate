# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Pydantic models for committed JSON fixtures and baselines."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ChatFieldModel(BaseModel):
    key: str
    value: str


class ChatDocumentModel(BaseModel):
    title: str = ""
    filename: str = "fixture.pdf"
    text: str
    fields: list[ChatFieldModel] = Field(default_factory=list)


ChatCaseKind = Literal["answerable", "unanswerable", "multi_doc", "open"]


class ChatCaseModel(BaseModel):
    id: str
    kind: ChatCaseKind
    question: str
    documents: list[ChatDocumentModel]
    answer_must_contain: list[str] = Field(default_factory=list)
    answer_must_not_contain: list[str] = Field(default_factory=list)
    acceptable_answers: list[str] = Field(default_factory=list)
    open_min_token_hits: int = 1
    evidence_in_retrieval: list[str] = Field(default_factory=list)
    required_source_tags: list[str] = Field(default_factory=list)


class ChatFixturesFile(BaseModel):
    version: int
    seed: int
    provenance: str
    cases: list[ChatCaseModel]


class BaselineDirectionModel(BaseModel):
    metric_direction: dict[str, Literal["higher_is_better", "lower_is_better"]]
    metrics: dict[str, float]
    version: int


class LayoutSsimFixtureEntry(BaseModel):
    before_ssim: float
    category: str | None = None


class LayoutSsimBaselineFile(BaseModel):
    version: int
    dpi: int | None = None
    fixtures: dict[str, LayoutSsimFixtureEntry]


class ClassificationTextExample(BaseModel):
    document_id: str
    label_id: str
    text: str


class ClassificationFixturesFile(BaseModel):
    version: int
    seed: int
    provenance: str
    label_ids: list[str]
    examples: list[ClassificationTextExample]
