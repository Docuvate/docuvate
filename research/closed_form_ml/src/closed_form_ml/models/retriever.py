# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import math
import re
from collections import Counter
from dataclasses import dataclass, field

import numpy as np

from closed_form_ml.embeddings import embed_passages, embed_queries, l2_normalize
from closed_form_ml.interfaces import RetrievalHit
from closed_form_ml.layers import NystromKernelRidge


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-ZäöüÄÖÜß0-9]+", text.lower())


@dataclass
class HybridE5Bm25Retriever:
    """BM25-lite + e5 cosine (CE-shaped hybrid without API)."""

    document_ids: list[str] = field(default_factory=list)
    texts: list[str] = field(default_factory=list)
    doc_vectors: np.ndarray | None = None
    df: Counter[str] = field(default_factory=Counter)
    avg_dl: float = 0.0
    k1: float = 1.2
    b: float = 0.75

    def index(self, document_ids: list[str], texts: list[str]) -> None:
        self.document_ids = list(document_ids)
        self.texts = list(texts)
        self.doc_vectors = l2_normalize(embed_passages(texts))
        self.df = Counter()
        lengths: list[int] = []
        for text in texts:
            tokens = _tokenize(text)
            lengths.append(len(tokens))
            self.df.update(set(tokens))
        self.avg_dl = float(sum(lengths) / max(len(lengths), 1))

    def _bm25(self, query: str) -> list[float]:
        q_tokens = _tokenize(query)
        n_docs = len(self.texts)
        scores: list[float] = []
        for text in self.texts:
            tokens = _tokenize(text)
            dl = len(tokens)
            tf = Counter(tokens)
            score = 0.0
            for term in q_tokens:
                if term not in tf:
                    continue
                df = self.df.get(term, 0)
                idf = math.log(1 + (n_docs - df + 0.5) / (df + 0.5))
                freq = tf[term]
                denom = freq + self.k1 * (1 - self.b + self.b * dl / max(self.avg_dl, 1.0))
                score += idf * (freq * (self.k1 + 1)) / denom
            scores.append(score)
        return scores

    def retrieve(self, query: str, *, top_k: int = 5) -> list[RetrievalHit]:
        if self.doc_vectors is None:
            return []
        q_vec = l2_normalize(embed_queries([query]))[0]
        dense = (self.doc_vectors @ q_vec).tolist()
        sparse = self._bm25(query)
        # RRF-style fusion ranks
        dense_rank = np.argsort(np.argsort(-np.asarray(dense)))
        sparse_rank = np.argsort(np.argsort(-np.asarray(sparse)))
        fused = 1.0 / (60 + dense_rank) + 1.0 / (60 + sparse_rank)
        order = np.argsort(-fused)[:top_k]
        hits: list[RetrievalHit] = []
        for idx in order:
            hits.append(
                RetrievalHit(
                    self.document_ids[int(idx)],
                    float(fused[int(idx)]),
                    self.texts[int(idx)],
                )
            )
        return hits


@dataclass
class KernelRerankRetriever(HybridE5Bm25Retriever):
    """Hybrid retrieval + Nyström kernel ridge rerank on top-k pool."""

    reranker: NystromKernelRidge | None = None
    train_queries: list[str] = field(default_factory=list)
    train_relevance: list[int] = field(default_factory=list)

    def fit_reranker(self, queries: list[str], relevant_doc_index: list[int]) -> None:
        q_vecs = l2_normalize(embed_queries(queries))
        y = np.asarray(relevant_doc_index, dtype=np.float64)
        self.reranker = NystromKernelRidge.fit(q_vecs, y, n_landmarks=min(32, len(queries)), seed=11)
        self.train_queries = queries
        self.train_relevance = relevant_doc_index

    def retrieve(self, query: str, *, top_k: int = 5) -> list[RetrievalHit]:
        pool_k = max(top_k * 3, 10)
        base = super().retrieve(query, top_k=pool_k)
        if self.reranker is None or not base:
            return base[:top_k]
        q_vec = l2_normalize(embed_queries([query]))
        # Rerank pool by kernel score on document vectors
        idx_map = {doc_id: i for i, doc_id in enumerate(self.document_ids)}
        doc_indices = [idx_map[h.document_id] for h in base]
        doc_vecs = self.doc_vectors[doc_indices] if self.doc_vectors is not None else None
        if doc_vecs is None:
            return base[:top_k]
        # Use query-doc concatenation kernel proxy via elementwise product sum
        combined = doc_vecs * q_vec
        scores = self.reranker.predict(combined)
        order = np.argsort(-scores)[:top_k]
        return [base[int(i)] for i in order]
