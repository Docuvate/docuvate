from __future__ import annotations

import os
import threading

from pydantic import BaseModel

_lock = threading.Lock()
_reranker = None
_reranker_failed = False

RERANKER_MODEL = os.environ.get(
    "DOCUVATE_RERANKER_MODEL", "jinaai/jina-reranker-v2-base-multilingual"
)


class RagPassage(BaseModel):
    id: str
    text: str


class RagRetrieveResult(BaseModel):
    id: str
    score: float


def _get_reranker():
    global _reranker, _reranker_failed
    if _reranker_failed:
        return None
    if _reranker is not None:
        return _reranker
    with _lock:
        if _reranker is not None:
            return _reranker
        if os.environ.get("DOCUVATE_AI_PROFILE", "cpu-small") == "off":
            _reranker_failed = True
            return None
        try:
            from fastembed import TextCrossEncoder

            _reranker = TextCrossEncoder(model_name=RERANKER_MODEL)
        except Exception:
            _reranker_failed = True
            return None
        return _reranker


def rerank_passages(query: str, passages: list[RagPassage], top_k: int = 4) -> list[RagRetrieveResult]:
    if not passages:
        return []
    model = _get_reranker()
    if model is None:
        return [
            RagRetrieveResult(id=p.id, score=float(len(passages) - i))
            for i, p in enumerate(passages[:top_k])
        ]
    scores = list(model.rerank(query, [p.text for p in passages]))
    ranked = sorted(
        zip(passages, scores, strict=True),
        key=lambda row: row[1],
        reverse=True,
    )
    return [
        RagRetrieveResult(id=p.id, score=float(score)) for p, score in ranked[:top_k]
    ]
