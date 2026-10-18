# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import logging
import math
import os
import threading
from typing import Protocol, cast

from pydantic import BaseModel


class _TextCrossEncoder(Protocol):
    def rerank(self, query: str, texts: list[str]) -> list[float]: ...

logger = logging.getLogger(__name__)

_lock = threading.Lock()
_reranker = None
_reranker_failed = False
_reranker_failure_reason: str | None = None

# Permissive licenses only (see apps/worker/tests/test_reranker_license.py).
DEFAULT_RERANKER_MODEL = "BAAI/bge-reranker-v2-m3-int8"
RERANKER_MODEL = os.environ.get("DOCUVATE_RERANKER_MODEL", DEFAULT_RERANKER_MODEL)

# Permissive licenses only (Apache-2.0 / MIT). See apps/worker/tests/test_reranker_license.py.
PERMISSIVE_RERANKER_MODELS = frozenset(
    {
        "BAAI/bge-reranker-v2-m3",
        "BAAI/bge-reranker-v2-m3-int8",
        "BAAI/bge-reranker-base",
        "Xenova/ms-marco-MiniLM-L-6-v2",
        "Xenova/ms-marco-MiniLM-L-12-v2",
    }
)


class RagPassage(BaseModel):
    id: str
    text: str


class RagRetrieveResult(BaseModel):
    id: str
    score: float


def sigmoid_score(raw: float) -> float:
    if raw >= 0:
        return 1.0 / (1.0 + math.exp(-raw))
    exp_x = math.exp(raw)
    return exp_x / (1.0 + exp_x)


def reranker_status() -> dict[str, str | bool]:
    """Load state for health and provider listings (does not download models)."""
    profile = os.environ.get("DOCUVATE_AI_PROFILE", "cpu-small")
    if profile == "off":
        return {
            "model": RERANKER_MODEL,
            "available": False,
            "loaded": False,
            "reason": "DOCUVATE_AI_PROFILE=off",
        }
    if RERANKER_MODEL not in PERMISSIVE_RERANKER_MODELS:
        return {
            "model": RERANKER_MODEL,
            "available": False,
            "loaded": False,
            "reason": "model_not_on_permissive_allowlist",
        }
    if _reranker_failed:
        return {
            "model": RERANKER_MODEL,
            "available": False,
            "loaded": False,
            "reason": _reranker_failure_reason or "load_failed",
        }
    if _reranker is not None:
        return {"model": RERANKER_MODEL, "available": True, "loaded": True, "reason": ""}
    return {"model": RERANKER_MODEL, "available": True, "loaded": False, "reason": ""}


def _get_reranker() -> _TextCrossEncoder | None:
    global _reranker, _reranker_failed, _reranker_failure_reason  # noqa: PLW0603
    if _reranker_failed:
        return None
    if _reranker is not None:
        return _reranker
    with _lock:
        if _reranker is not None:
            return _reranker
        if os.environ.get("DOCUVATE_AI_PROFILE", "cpu-small") == "off":
            _reranker_failed = True
            _reranker_failure_reason = "DOCUVATE_AI_PROFILE=off"
            return None
        if RERANKER_MODEL not in PERMISSIVE_RERANKER_MODELS:
            _reranker_failed = True
            _reranker_failure_reason = "model_not_on_permissive_allowlist"
            logger.error("Reranker model %s is not on the permissive allowlist", RERANKER_MODEL)
            return None
        try:
            from fastembed.rerank.cross_encoder import TextCrossEncoder  # noqa: PLC0415

            _reranker = cast(
                _TextCrossEncoder, TextCrossEncoder(model_name=RERANKER_MODEL)
            )
            logger.info("Loaded reranker model %s", RERANKER_MODEL)
        except Exception as exc:
            _reranker_failed = True
            _reranker_failure_reason = str(exc)
            logger.exception("Failed to load reranker model %s", RERANKER_MODEL)
            return None
        return _reranker


def ensure_reranker_loaded() -> bool:
    return _get_reranker() is not None


def rerank_passages(
    query: str, passages: list[RagPassage], top_k: int = 4
) -> tuple[list[RagRetrieveResult], bool]:
    """Returns (ranked results, reranker_used). When reranker is unavailable, results are empty."""
    if not passages:
        return [], False
    model = _get_reranker()
    if model is None:
        return [], False
    raw_scores = list(model.rerank(query, [p.text for p in passages]))
    ranked = sorted(
        zip(passages, raw_scores, strict=True),
        key=lambda row: row[1],
        reverse=True,
    )
    return [
        RagRetrieveResult(id=p.id, score=sigmoid_score(float(score)))
        for p, score in ranked[:top_k]
    ], True
