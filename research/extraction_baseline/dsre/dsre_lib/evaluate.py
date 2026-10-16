# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from dsre_lib.constants import (
    MIN_ACCEPTED_CAL,
    MIN_ACCEPTED_CONFIRM,
    SPLIT_CAL,
    SPLIT_CONFIRM,
    SPLIT_TEST,
    SPLIT_TRAIN,
    TARGET_PRECISION,
)
from dsre_lib.features import HeadKind, build_features
from dsre_lib.npz_store import DsreNpz
from dsre_lib.ridge import predict_scores


@dataclass
class EpisodePrediction:
    episode: int
    score: float
    pred_global_idx: int
    gold_global_idx: int
    abstained: bool
    field_absent: bool
    correct: bool
    split: int
    family: int
    field_type: int
    field_key: int


def clopper_pearson_lcb(successes: int, trials: int, alpha: float = 0.05) -> float:
    if trials == 0:
        return 0.0
    from scipy.stats import beta

    return float(beta.ppf(alpha, successes, trials - successes + 1))


def episode_slices(data: DsreNpz) -> list[tuple[int, int]]:
    out: list[tuple[int, int]] = []
    for ep in range(len(data.gold)):
        doc_idx = int(data.episode_doc[ep])
        start = int(data.offsets[doc_idx])
        end = int(data.offsets[doc_idx + 1])
        out.append((start, end))
    return out


def train_head(data: DsreNpz, kind: HeadKind) -> np.ndarray | None:
    if kind == HeadKind.COSINE:
        return None
    from dsre_lib.features import feature_dim

    dim = feature_dim(kind)
    xtx = np.zeros((dim, dim), dtype=np.float64)
    xty = np.zeros((dim,), dtype=np.float64)
    seen = False
    slices = episode_slices(data)
    for ep, (start, end) in enumerate(slices):
        if int(data.split[ep]) not in (SPLIT_TRAIN,):
            continue
        if end <= start:
            continue
        q = data.schema_vec[int(data.field_key[ep])]
        span = data.span_vec[start:end]
        layout = data.layout[start:end]
        feats = build_features(span, q, layout, kind).astype(np.float64)
        gold = int(data.gold[ep])
        if gold < 0:
            continue
        local_gold = gold - start
        count = end - start
        w_row = 1.0 / count
        for row_idx in range(count):
            x = feats[row_idx]
            y = 1.0 if row_idx == local_gold else 0.0
            wx = w_row * x
            xtx += np.outer(x, wx)
            xty += wx * y
            seen = True
    if not seen:
        return None
    reg = np.eye(dim, dtype=np.float64) * 10.0
    reg[-1, -1] = 0.0
    return np.linalg.solve(xtx + reg, xty)


def score_episode(
    data: DsreNpz,
    ep: int,
    kind: HeadKind,
    weights: np.ndarray | None,
) -> tuple[float, int]:
    start, end = episode_slices(data)[ep]
    if end <= start:
        return -1e9, -1
    q = data.schema_vec[int(data.field_key[ep])]
    span = data.span_vec[start:end]
    layout = data.layout[start:end]
    if kind == HeadKind.COSINE:
        scores = (span @ q.reshape(-1, 1)).reshape(-1)
    else:
        assert weights is not None
        feats = build_features(span, q, layout, kind)
        scores = predict_scores(feats.astype(np.float64), weights)
    best_local = int(np.argmax(scores))
    return float(scores[best_local]), start + best_local


def episode_score_cache(
    data: DsreNpz,
    kind: HeadKind,
    weights: np.ndarray | None,
) -> list[tuple[float, int, int]]:
    """Per episode: (best_score, pred_global_idx, gold_global_idx)."""
    out: list[tuple[float, int, int]] = []
    for ep in range(len(data.gold)):
        score, pred_idx = score_episode(data, ep, kind, weights)
        out.append((score, pred_idx, int(data.gold[ep])))
    return out


def pick_threshold(
    cache: list[tuple[float, int, int]],
    data: DsreNpz,
    split_code: int,
) -> float:
    scores = sorted(
        {
            score
            for ep, (score, _, _) in enumerate(cache)
            if int(data.split[ep]) == split_code and not data.field_absent[ep]
        },
        reverse=True,
    )
    if not scores:
        return float("inf")
    best_tau = float("inf")
    best_count = -1
    for tau in scores:
        accepted = [
            ep
            for ep, (score, _, _) in enumerate(cache)
            if int(data.split[ep]) == split_code
            and not data.field_absent[ep]
            and score >= tau
        ]
        if len(accepted) < MIN_ACCEPTED_CAL:
            continue
        correct = sum(
            1
            for ep in accepted
            if cache[ep][2] >= 0 and cache[ep][1] == cache[ep][2]
        )
        prec = correct / len(accepted)
        if prec >= TARGET_PRECISION and len(accepted) > best_count:
            best_count = len(accepted)
            best_tau = tau
    return best_tau


def evaluate_head(data: DsreNpz, kind: HeadKind) -> dict[str, object]:
    weights = train_head(data, kind)
    cache = episode_score_cache(data, kind, weights)
    tau = pick_threshold(cache, data, SPLIT_CAL)

    raw_preds: list[EpisodePrediction] = []
    for ep, (score, pred_idx, gold_idx) in enumerate(cache):
        absent = bool(data.field_absent[ep])
        if absent:
            correct = False
        else:
            correct = gold_idx >= 0 and pred_idx == gold_idx
        raw_preds.append(
            EpisodePrediction(
                episode=ep,
                score=score,
                pred_global_idx=pred_idx,
                gold_global_idx=gold_idx,
                abstained=False,
                field_absent=absent,
                correct=correct,
                split=int(data.split[ep]),
                family=int(data.family[ep]),
                field_type=int(data.field_type[ep]),
                field_key=int(data.field_key[ep]),
            )
        )

    gated: list[EpisodePrediction] = []
    for p in raw_preds:
        abstained = p.score < tau
        pred_idx = -1 if abstained else p.pred_global_idx
        if p.field_absent:
            correct = abstained
        else:
            correct = (not abstained) and p.gold_global_idx >= 0 and pred_idx == p.gold_global_idx
        gated.append(
            EpisodePrediction(
                episode=p.episode,
                score=p.score,
                pred_global_idx=pred_idx,
                gold_global_idx=p.gold_global_idx,
                abstained=abstained,
                field_absent=p.field_absent,
                correct=correct,
                split=p.split,
                family=p.family,
                field_type=p.field_type,
                field_key=p.field_key,
            )
        )

    confirm_preds = [p for p in gated if p.split == SPLIT_CONFIRM and not p.abstained]
    confirm_correct = sum(1 for p in confirm_preds if p.correct)
    confirm_lcb = clopper_pearson_lcb(confirm_correct, len(confirm_preds))
    product_ok = len(confirm_preds) >= MIN_ACCEPTED_CONFIRM and confirm_lcb >= TARGET_PRECISION

    def metrics(subset: list[EpisodePrediction], *, gated_flag: bool) -> dict[str, float]:
        present = [p for p in subset if not p.field_absent]
        if not present:
            return {"precision": 0.0, "recall": 0.0, "f1": 0.0, "exact_span_f1": 0.0}
        if gated_flag:
            accepted = [p for p in present if not p.abstained]
        else:
            accepted = present
        tp = sum(1 for p in accepted if p.correct)
        fp = sum(1 for p in accepted if not p.correct)
        fn = sum(1 for p in present if (p.abstained if gated_flag else False) or not p.correct)
        prec = tp / (tp + fp) if (tp + fp) else 0.0
        rec = tp / (tp + fn) if (tp + fn) else 0.0
        f1 = 2 * prec * rec / (prec + rec) if (prec + rec) else 0.0
        return {"precision": prec, "recall": rec, "f1": f1, "exact_span_f1": f1}

    test_raw = [p for p in raw_preds if p.split == SPLIT_TEST]
    test_gated = [p for p in gated if p.split == SPLIT_TEST]
    absent_fp = sum(1 for p in test_gated if p.field_absent and not p.abstained)

    train_families = {int(f) for f, s in zip(data.family, data.split, strict=True) if s == SPLIT_TRAIN}
    unseen_template = [p for p in test_raw if p.family not in train_families]

    train_field_types = {
        int(ft)
        for ft, s, a in zip(data.field_type, data.split, data.field_absent, strict=True)
        if s == SPLIT_TRAIN and not a
    }
    unseen_field = [
        p
        for p in test_raw
        if int(data.field_type[p.episode]) not in train_field_types and not p.field_absent
    ]
    intersection = [
        p
        for p in unseen_template
        if int(data.field_type[p.episode]) not in train_field_types and not p.field_absent
    ]

    return {
        "head": kind.value,
        "threshold": tau,
        "confirm_accepted": len(confirm_preds),
        "confirm_lcb": confirm_lcb,
        "product_approved": product_ok,
        "test_raw": metrics(test_raw, gated_flag=False),
        "test_gated": metrics(test_gated, gated_flag=True),
        "test_absent_false_positives": float(absent_fp),
        "unseen_template_raw_f1": metrics(unseen_template, gated_flag=False)["f1"],
        "unseen_field_type_raw_f1": metrics(unseen_field, gated_flag=False)["f1"],
        "unseen_template_and_field_raw_f1": metrics(intersection, gated_flag=False)["f1"],
    }


def candidate_recall(data: DsreNpz) -> float:
    hits = 0
    total = 0
    for ep in range(len(data.gold)):
        if data.field_absent[ep]:
            continue
        total += 1
        if int(data.gold[ep]) >= 0:
            hits += 1
    return hits / total if total else 0.0


def bootstrap_f1(
    preds: list[EpisodePrediction],
    *,
    split_code: int = SPLIT_TEST,
    rounds: int = 400,
    seed: int = 0,
) -> tuple[float, float]:
    rng = np.random.default_rng(seed)
    families = sorted({p.family for p in preds if p.split == split_code})
    if not families:
        return 0.0, 0.0
    by_family: dict[int, list[EpisodePrediction]] = {}
    for p in preds:
        if p.split == split_code:
            by_family.setdefault(p.family, []).append(p)
    f1s: list[float] = []
    for _ in range(rounds):
        sample = rng.choice(families, size=len(families), replace=True)
        subset: list[EpisodePrediction] = []
        for fam in sample:
            subset.extend(by_family[int(fam)])
        tp = sum(1 for p in subset if not p.field_absent and p.correct and not p.abstained)
        fp = sum(1 for p in subset if not p.field_absent and not p.abstained and not p.correct)
        fn = sum(
            1
            for p in subset
            if not p.field_absent and (p.abstained or not p.correct)
        )
        prec = tp / (tp + fp) if (tp + fp) else 0.0
        rec = tp / (tp + fn) if (tp + fn) else 0.0
        f1 = 2 * prec * rec / (prec + rec) if (prec + rec) else 0.0
        f1s.append(f1)
    arr = np.array(f1s)
    return float(np.percentile(arr, 2.5)), float(np.percentile(arr, 97.5))
