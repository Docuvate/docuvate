#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""MIRACL de dev retrieval via ir_datasets (German, license-clean)."""

from __future__ import annotations

import json
import math
import os
import random
import re
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np
from sklearn.linear_model import LogisticRegression

ROOT = Path(__file__).resolve().parents[1]
DSRE_LIB = ROOT.parents[1] / "research" / "extraction_baseline" / "dsre"
sys.path.insert(0, str(DSRE_LIB))

from dsre_lib.e5_encode import embed_passages, embed_queries  # noqa: E402

RESULTS = ROOT / "results"
os.environ.setdefault("OMP_NUM_THREADS", "4")
TOKEN = re.compile(r"\w+", re.UNICODE)


def tokenize(text: str) -> list[str]:
    return [t.lower() for t in TOKEN.findall(text)]


def bm25_score(query_tokens: list[str], doc_tokens: list[str], df: dict[str, int], n_docs: int) -> float:
    k1 = 1.2
    b = 0.75
    avgdl = 120.0
    dl = len(doc_tokens) or 1
    tf: dict[str, int] = defaultdict(int)
    for t in doc_tokens:
        tf[t] += 1
    score = 0.0
    for term in query_tokens:
        if term not in tf:
            continue
        idf = math.log(1.0 + (n_docs - df.get(term, 0) + 0.5) / (df.get(term, 0) + 0.5))
        freq = tf[term]
        denom = freq + k1 * (1.0 - b + b * dl / avgdl)
        score += idf * (freq * (k1 + 1.0)) / denom
    return score


def rrf_rank(rank_lists: list[list[str]], k: int = 60) -> list[tuple[str, float]]:
    scores: dict[str, float] = defaultdict(float)
    for ranks in rank_lists:
        for idx, doc_id in enumerate(ranks):
            scores[doc_id] += 1.0 / (k + idx + 1)
    return sorted(scores.items(), key=lambda x: -x[1])


def ndcg_at_k(relevants: set[str], ranked: list[str], k: int) -> float:
    dcg = 0.0
    for i, doc_id in enumerate(ranked[:k]):
        if doc_id in relevants:
            dcg += 1.0 / math.log2(i + 2)
    ideal_hits = min(len(relevants), k)
    idcg = sum(1.0 / math.log2(i + 2) for i in range(ideal_hits))
    return dcg / idcg if idcg else 0.0


def recall_at_k(relevants: set[str], ranked: list[str], k: int) -> float:
    if not relevants:
        return 0.0
    return 1.0 if any(doc_id in relevants for doc_id in ranked[:k]) else 0.0


def embed_query(text: str) -> np.ndarray:
    return embed_queries([text])[0]


def embed_passages_batched(texts: list[str], batch: int = 32) -> np.ndarray:
    parts: list[np.ndarray] = []
    for i in range(0, len(texts), batch):
        parts.append(embed_passages(texts[i : i + batch]))
    return np.vstack(parts) if parts else np.zeros((0, 384), dtype=np.float32)


def main() -> int:
    import ir_datasets

    random.seed(7)
    dataset = ir_datasets.load("miracl/de/dev")
    qrels_map: dict[str, set[str]] = defaultdict(set)
    judged_docs: set[str] = set()
    for row in dataset.qrels_iter():
        judged_docs.add(row.doc_id)
        if int(row.relevance) > 0:
            qrels_map[row.query_id].add(row.doc_id)

    queries = [(q.query_id, q.text) for q in dataset.queries_iter()]
    needed = set(judged_docs)

    store = dataset.docs_store()
    id_to_text: dict[str, str] = {}
    for doc in store.get_many_iter(needed):
        id_to_text[doc.doc_id] = doc.text

    corpus_ids = list(id_to_text.keys())
    corpus_texts = [id_to_text[cid] for cid in corpus_ids]
    tokenized = [tokenize(t) for t in corpus_texts]
    df: dict[str, int] = defaultdict(int)
    for toks in tokenized:
        for term in set(toks):
            df[term] += 1
    n_docs = len(corpus_ids)
    passage_vecs = embed_passages_batched(corpus_texts)

    train_n = max(50, len(queries) // 3)
    train_queries = queries[:train_n]
    test_queries = queries[train_n:]

    reranker: LogisticRegression | None = None
    train_x: list[list[float]] = []
    train_y: list[int] = []

    def rank_lists(qtext: str) -> tuple[list[str], list[str], list[str]]:
        qtok = tokenize(qtext)
        bm25_scores = [(cid, bm25_score(qtok, tokenized[i], df, n_docs)) for i, cid in enumerate(corpus_ids)]
        bm25_scores.sort(key=lambda x: -x[1])
        bm25_rank = [cid for cid, _ in bm25_scores]
        qvec = embed_query(qtext)
        dots = passage_vecs @ qvec
        e5_rank = [corpus_ids[i] for i in np.argsort(-dots)]
        hybrid_rank = [doc_id for doc_id, _ in rrf_rank([bm25_rank, e5_rank])]
        return bm25_rank, e5_rank, hybrid_rank

    for qid, qtext in train_queries:
        rel = qrels_map.get(qid, set())
        if not rel:
            continue
        bm25_rank, e5_rank, hybrid_rank = rank_lists(qtext)
        for cid in hybrid_rank[:40]:
            bm25_pos = bm25_rank.index(cid)
            e5_pos = e5_rank.index(cid)
            train_x.append([1.0 / (1 + bm25_pos), 1.0 / (1 + e5_pos)])
            train_y.append(1 if cid in rel else 0)
    if len(train_x) >= 100 and sum(train_y) > 5:
        reranker = LogisticRegression(max_iter=200)
        reranker.fit(np.array(train_x, dtype=np.float64), np.array(train_y, dtype=np.int32))

    def metrics(method: str) -> dict[str, float]:
        r20: list[float] = []
        ndcg10: list[float] = []
        src1: list[float] = []
        for qid, qtext in test_queries:
            rel = qrels_map.get(qid, set())
            if not rel:
                continue
            bm25_rank, e5_rank, hybrid_rank = rank_lists(qtext)
            if method == "bm25_proxy":
                ranked = bm25_rank
            elif method == "e5_dense":
                ranked = e5_rank
            elif method == "hybrid_rrf":
                ranked = hybrid_rank
            else:
                scored = []
                for cid in hybrid_rank[:40]:
                    bm25_pos = bm25_rank.index(cid)
                    e5_pos = e5_rank.index(cid)
                    feats = np.array([[1.0 / (1 + bm25_pos), 1.0 / (1 + e5_pos)]], dtype=np.float64)
                    prob = float(reranker.predict_proba(feats)[0][1]) if reranker else 0.0
                    scored.append((cid, prob))
                scored.sort(key=lambda x: -x[1])
                ranked = [cid for cid, _ in scored]
            r20.append(recall_at_k(rel, ranked, 20))
            ndcg10.append(ndcg_at_k(rel, ranked, 10))
            src1.append(1.0 if ranked and ranked[0] in rel else 0.0)
        n = len(r20) or 1
        return {
            "recall_at_20": sum(r20) / n,
            "ndcg_at_10": sum(ndcg10) / n,
            "source_correct_at_1": sum(src1) / n,
            "queries_evaluated": float(len(r20)),
        }

    manifest_path = ROOT.parents[1] / "research" / "extraction_baseline" / "results" / "model_manifest.json"
    e5_manifest: dict[str, object] = {}
    if manifest_path.is_file():
        e5_manifest = json.loads(manifest_path.read_text(encoding="utf-8")).get("e5_small_onnx_int8", {})

    report = {
        "benchmark_kind": "public_miracl_de_dev_retrieval",
        "loader": "ir_datasets miracl/de/dev",
        "license": "MIRACL dataset (see https://github.com/project-miracl/miracl)",
        "dense_encoder": e5_manifest,
        "corpus_docs_loaded": len(corpus_ids),
        "methods": {
            "bm25_proxy": metrics("bm25_proxy"),
            "e5_dense_only": metrics("e5_dense"),
            "hybrid_bm25_e5_rrf": metrics("hybrid_rrf"),
            "hybrid_plus_logistic_reranker": metrics("hybrid_rerank"),
        },
    }
    RESULTS.mkdir(parents=True, exist_ok=True)
    (RESULTS / "retrieval_miracl_de.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
