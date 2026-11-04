# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Offline label-ranker eval: hybrid kNN (previous product) vs Ridge / Hopfield / agreement.

No data ships with the repo. Pass a JSON list of ``{"label": str, "text": str}`` records and a
``.npy`` matrix of e5 passage vectors (same row order). Protocol per seed: ``k`` labelled examples
per class, examples 10..34 of every class as test set, features built over labelled + test docs.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from numpy.typing import NDArray

from docuvate_worker.infrastructure.ml.ce_ml.hybrid_knn import hybrid_binary_label_scores
from docuvate_worker.infrastructure.ml.ce_ml.label_ranker import (
    auto_accept_mask,
    build_label_features,
    learn_auto_accept_margin,
    leave_one_out_votes,
    predict_label_votes,
)

_SHOTS = (1, 3, 5, 10)
_TEST_START = 10
_TEST_END = 35
_SEEDS = 3


def _run(
    labels: NDArray[np.int64], texts: list[str], vectors: NDArray[np.float64], k: int, seed: int
) -> dict[str, float]:
    classes = int(labels.max()) + 1
    rng = np.random.default_rng(seed)
    perm = [rng.permutation(np.flatnonzero(labels == c)) for c in range(classes)]
    train = np.concatenate([p[:k] for p in perm])
    test = np.concatenate([p[_TEST_START:_TEST_END] for p in perm])
    rows = np.concatenate([train, test])
    n_train = train.size
    sub_texts = [texts[int(i)] for i in rows]
    truth = labels[test]
    knn = np.zeros((test.size, classes))
    for c in range(classes):
        mask = (labels[rows] == c).astype(np.float32)
        mask[n_train:] = 0.0
        scores = hybrid_binary_label_scores(
            vectors[rows], sub_texts, pool_indices=list(range(n_train)), positive_mask=mask
        )
        knn[:, c] = scores[n_train:]
    features = build_label_features(vectors[rows], sub_texts)
    train_labels = labels[train]
    votes = predict_label_votes(features[n_train:], features[:n_train], train_labels, classes)
    loo = leave_one_out_votes(features[:n_train], train_labels, classes)
    margin = learn_auto_accept_margin(loo, train_labels)
    counts = np.bincount(train_labels, minlength=classes).astype(np.int64)
    accepted = auto_accept_mask(votes, margin_threshold=margin, examples_per_class=counts)
    covered = int(accepted.sum())
    return {
        "knn": float((knn.argmax(axis=1) == truth).mean()),
        "ridge": float((votes.ridge == truth).mean()),
        "hopfield": float((votes.hopfield == truth).mean()),
        "auto_cov": covered / truth.size,
        "auto_correct": float((votes.ridge[accepted] == truth[accepted]).sum()),
        "auto_n": float(covered),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("dataset", type=Path)
    parser.add_argument("vectors", type=Path)
    args = parser.parse_args()
    records = json.loads(Path(args.dataset).read_text(encoding="utf-8"))
    names = sorted({str(r["label"]) for r in records})
    labels = np.asarray([names.index(str(r["label"])) for r in records], dtype=np.int64)
    texts = [str(r["text"])[:4000] for r in records]
    vectors = np.asarray(np.load(args.vectors), dtype=np.float64)
    print("k  knn_top1  ridge_top1  hopfield_top1  auto_precision  auto_coverage")
    for k in _SHOTS:
        runs = [_run(labels, texts, vectors, k, seed) for seed in range(_SEEDS)]
        mean = {key: float(np.mean([r[key] for r in runs])) for key in runs[0]}
        n_auto = sum(r["auto_n"] for r in runs)
        precision = sum(r["auto_correct"] for r in runs) / n_auto if n_auto else float("nan")
        print(
            f"{k:<2} {mean['knn']:.3f}     {mean['ridge']:.3f}       {mean['hopfield']:.3f}"
            f"          {precision:.3f}           {mean['auto_cov']:.3f}"
        )


if __name__ == "__main__":
    main()
