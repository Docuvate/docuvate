# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass

from docuvate_worker.domain.smart_duplicates.config import (
    DEFAULT_SMART_DUPLICATE_CONFIG,
    SmartDuplicateConfig,
)
from docuvate_worker.domain.smart_duplicates.minhash import (
    minhash_jaccard_estimate,
    minhash_signature,
)
from docuvate_worker.domain.smart_duplicates.shingles import character_shingles, jaccard_similarity
from docuvate_worker.domain.smart_duplicates.value_fingerprint import value_fingerprint_tokens

_MIN_TEMPLATE_CORPUS_FOR_DEV_DELTA = 8


@dataclass(frozen=True)
class SmartDuplicateDocument:
    document_id: str
    lines: list[str]


@dataclass(frozen=True)
class SmartDuplicateCandidate:
    document_id: str
    similarity: float


def _template_df_cutoff(delta: float, doc_count: int) -> float:
    """Dev-tuned ``delta`` assumes a wide sender bucket; small buckets use stricter subtraction."""
    if doc_count < _MIN_TEMPLATE_CORPUS_FOR_DEV_DELTA:
        return 1.0
    return delta


def _residual_shingles(
    docs: list[SmartDuplicateDocument],
    *,
    shingle_size: int,
    delta: float,
) -> list[set[str]]:
    shingles_per_doc = [character_shingles('\n'.join(doc.lines), size=shingle_size) for doc in docs]
    counts: Counter[str] = Counter()
    for shingles in shingles_per_doc:
        counts.update(shingles)
    doc_count = len(docs)
    cutoff = _template_df_cutoff(delta, doc_count)
    residual: list[set[str]] = []
    for shingles in shingles_per_doc:
        residual.append({g for g in shingles if counts[g] / doc_count < cutoff})
    return residual


def _combined_similarity(
    residual_a: set[str],
    residual_b: set[str],
    values_a: set[str],
    values_b: set[str],
    *,
    alpha: float,
    num_perm: int,
) -> float:
    residual_sim = jaccard_similarity(residual_a, residual_b)
    value_sim = jaccard_similarity(values_a, values_b)
    exact = alpha * residual_sim + (1.0 - alpha) * value_sim

    residual_mh = minhash_signature(residual_a, num_perm=num_perm)
    peer_residual_mh = minhash_signature(residual_b, num_perm=num_perm)
    value_mh = minhash_signature(values_a, num_perm=num_perm)
    peer_value_mh = minhash_signature(values_b, num_perm=num_perm)
    mh = alpha * minhash_jaccard_estimate(residual_mh, peer_residual_mh) + (
        1.0 - alpha
    ) * minhash_jaccard_estimate(value_mh, peer_value_mh)
    return max(exact, mh)


def score_smart_duplicate_candidates(
    focus: SmartDuplicateDocument,
    peers: list[SmartDuplicateDocument],
    *,
    config: SmartDuplicateConfig | None = None,
) -> list[SmartDuplicateCandidate]:
    cfg = config or DEFAULT_SMART_DUPLICATE_CONFIG
    if not peers:
        return []

    corpus = [focus, *peers]
    residual_sets = _residual_shingles(corpus, shingle_size=cfg.shingle_size, delta=cfg.delta)
    value_sets = [value_fingerprint_tokens(doc.lines) for doc in corpus]

    focus_residual = residual_sets[0]
    focus_values = value_sets[0]
    hits: list[SmartDuplicateCandidate] = []
    for index, peer in enumerate(peers, start=1):
        similarity = _combined_similarity(
            focus_residual,
            residual_sets[index],
            focus_values,
            value_sets[index],
            alpha=cfg.alpha,
            num_perm=cfg.minhash_perm,
        )
        if similarity >= cfg.threshold:
            hits.append(
                SmartDuplicateCandidate(document_id=peer.document_id, similarity=similarity)
            )
    hits.sort(key=lambda row: row.similarity, reverse=True)
    return hits
