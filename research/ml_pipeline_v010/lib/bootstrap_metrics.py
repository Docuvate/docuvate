# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import numpy as np


def bootstrap_micro_f1(
    per_doc_tp: list[int],
    per_doc_fp: list[int],
    per_doc_fn: list[int],
    *,
    n_samples: int = 500,
    seed: int = 42,
) -> dict[str, float]:
    rng = np.random.default_rng(seed)
    n = len(per_doc_tp)
    if n == 0:
        return {"f1_mean": 0.0, "f1_low": 0.0, "f1_high": 0.0}
    f1s: list[float] = []
    for _ in range(n_samples):
        idx = rng.integers(0, n, size=n)
        tp = sum(per_doc_tp[i] for i in idx)
        fp = sum(per_doc_fp[i] for i in idx)
        fn = sum(per_doc_fn[i] for i in idx)
        prec = tp / (tp + fp) if (tp + fp) else 0.0
        rec = tp / (tp + fn) if (tp + fn) else 0.0
        f1 = 2 * prec * rec / (prec + rec) if (prec + rec) else 0.0
        f1s.append(f1)
    arr = np.array(f1s, dtype=np.float64)
    return {
        "f1_mean": float(arr.mean()),
        "f1_low": float(np.percentile(arr, 2.5)),
        "f1_high": float(np.percentile(arr, 97.5)),
        "n_bootstrap": float(n_samples),
    }
