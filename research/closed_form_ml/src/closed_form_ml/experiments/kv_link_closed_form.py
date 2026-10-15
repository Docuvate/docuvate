# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from closed_form_ml.deep_closed_form import TargetPropagationDeepClassifier
from closed_form_ml.layers import append_bias, ridge_solve


@dataclass
class BinaryLinkRidge:
    weights: NDArray[np.float64]

    @classmethod
    def fit(cls, x: NDArray[np.float64], y: NDArray[np.float64], *, reg: float = 1e-2) -> BinaryLinkRidge:
        w = ridge_solve(append_bias(x), y.reshape(-1, 1), reg=reg)
        return cls(w)

    def score(self, x: NDArray[np.float64]) -> NDArray[np.float64]:
        logits = (append_bias(x) @ self.weights).reshape(-1)
        return 1.0 / (1.0 + np.exp(-np.clip(logits, -20, 20)))


@dataclass
class BinaryLinkDeepTP:
    """Deep target-propagation stack for binary link scoring."""

    inner: TargetPropagationDeepClassifier

    @classmethod
    def fit(cls, x: NDArray[np.float64], y: NDArray[np.float64], *, seed: int = 9) -> BinaryLinkDeepTP:
        labels = ["neg" if v < 0.5 else "pos" for v in y.reshape(-1)]
        inner = TargetPropagationDeepClassifier.fit(
            x,
            labels,
            hidden_dims=(192, 96, 48),
            reg=5e-3,
            seed=seed,
        )
        return cls(inner)

    def score(self, x: NDArray[np.float64]) -> NDArray[np.float64]:
        probs = self.inner.predict_proba(x)
        # label_ids sorted: neg, pos
        if "pos" in self.inner.label_ids:
            pos_idx = self.inner.label_ids.index("pos")
            return probs[:, pos_idx]
        return probs[:, -1]
