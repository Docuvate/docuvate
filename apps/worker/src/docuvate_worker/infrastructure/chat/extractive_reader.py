# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Extractive QA reader (MIT distilled XLM-RoBERTa SQuAD2). Lazy-loaded."""

from __future__ import annotations

import logging
import os
import threading
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

logger = logging.getLogger(__name__)

READER_MODEL = os.environ.get(
    "DOCUVATE_EXTRACTIVE_READER_MODEL",
    "deepset/xlm-roberta-base-squad2-distilled",
)
_lock = threading.Lock()
_pipeline: Callable[..., Any] | None = None
_pipeline_failed = False


@dataclass(frozen=True)
class ExtractiveSpan:
    text: str
    score: float


def _load_pipeline() -> Callable[..., Any] | None:
    global _pipeline, _pipeline_failed  # noqa: PLW0603
    if _pipeline_failed:
        return None
    if _pipeline is not None:
        return _pipeline
    with _lock:
        if _pipeline_failed:
            return None
        if _pipeline is not None:
            return _pipeline
        if os.environ.get("DOCUVATE_AI_PROFILE") == "off":
            _pipeline_failed = True
            return None
        try:
            from transformers import pipeline  # noqa: PLC0415

            _pipeline = pipeline(
                "question-answering",
                model=READER_MODEL,
                device=-1,
            )
            return _pipeline
        except Exception as exc:
            logger.warning("extractive reader unavailable: %s", exc)
            _pipeline_failed = True
            return None


def read_span(question: str, context: str) -> ExtractiveSpan | None:
    trimmed_q = question.strip()
    trimmed_c = context.strip()
    if not trimmed_q or not trimmed_c:
        return None
    pipe = _load_pipeline()
    if pipe is None:
        return None
    try:
        out = pipe(question=trimmed_q, context=trimmed_c[:4000])
    except Exception:
        return None
    if not isinstance(out, dict):
        return None
    answer = str(out.get("answer", "")).strip()
    score = float(out.get("score", 0.0))
    if not answer or score < float(os.environ.get("DOCUVATE_EXTRACTIVE_READER_MIN_SCORE", "0.08")):
        return None
    return ExtractiveSpan(text=answer, score=score)
