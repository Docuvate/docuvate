# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Multi-layer closed-form stacks (target propagation + spectral/kernel ridges)."""

from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from closed_form_ml.layers import (
    NystromKernelRidge,
    RandomFeatureLayer,
    append_bias,
    one_hot,
    ridge_solve,
)


def _softmax_rows(logits: NDArray[np.float64]) -> NDArray[np.float64]:
    shifted = logits - np.max(logits, axis=1, keepdims=True)
    exp = np.exp(shifted)
    return exp / np.sum(exp, axis=1, keepdims=True)


@dataclass
class ShallowRidgeHead:
    """Single-layer ridge baseline."""

    weights: NDArray[np.float64]
    label_ids: list[str]

    @classmethod
    def fit(
        cls,
        x: NDArray[np.float64],
        label_ids: list[str],
        *,
        reg: float = 1e-2,
    ) -> ShallowRidgeHead:
        uniq = sorted(set(label_ids))
        idx = [uniq.index(lid) for lid in label_ids]
        y = one_hot(idx, len(uniq))
        w = ridge_solve(append_bias(x), y, reg=reg)
        return cls(w, uniq)

    def predict_proba(self, x: NDArray[np.float64]) -> NDArray[np.float64]:
        logits = append_bias(x) @ self.weights
        return _softmax_rows(logits)


@dataclass
class TargetPropagationDeepClassifier:
    """Layer-wise ridge with closed-form target propagation (GLM-style)."""

    layers: list[RandomFeatureLayer]
    readout: NDArray[np.float64]
    label_ids: list[str]
    hidden_dims: tuple[int, ...]

    @classmethod
    def fit(
        cls,
        x: NDArray[np.float64],
        label_ids: list[str],
        *,
        hidden_dims: tuple[int, ...] = (256, 128, 64),
        reg: float = 1e-2,
        seed: int = 13,
    ) -> TargetPropagationDeepClassifier:
        uniq = sorted(set(label_ids))
        idx = [uniq.index(lid) for lid in label_ids]
        y_onehot = one_hot(idx, len(uniq))
        h = np.asarray(x, dtype=np.float64)
        layers: list[RandomFeatureLayer] = []
        rng_seed = seed
        targets = y_onehot
        for hidden in hidden_dims:
            layer = RandomFeatureLayer.create(h.shape[1], hidden, seed=rng_seed)
            rng_seed += 1
            h_raw = layer.transform(h)
            h_bias = append_bias(h_raw)
            # Propagate targets: solve for best hidden representation matching next-layer targets
            w_prop = ridge_solve(h_bias, targets, reg=reg)
            targets = h_bias @ w_prop
            layers.append(layer)
            h = h_raw
        readout = ridge_solve(append_bias(h), y_onehot, reg=reg)
        return cls(layers, readout, uniq, hidden_dims)

    def _forward(self, x: NDArray[np.float64]) -> NDArray[np.float64]:
        h = np.asarray(x, dtype=np.float64)
        for layer in self.layers:
            h = layer.transform(h)
        return append_bias(h)

    def predict_proba(self, x: NDArray[np.float64]) -> NDArray[np.float64]:
        logits = self._forward(x) @ self.readout
        return _softmax_rows(logits)


@dataclass
class SpectralDeepClassifier:
    """Stacked PCA (spectral) embeddings + ridge at each depth; final ridge readout."""

    components: list[NDArray[np.float64]]
    means: list[NDArray[np.float64]]
    readout: NDArray[np.float64]
    label_ids: list[str]

    @classmethod
    def fit(
        cls,
        x: NDArray[np.float64],
        label_ids: list[str],
        *,
        spectral_dims: tuple[int, ...] = (128, 64, 32),
        reg: float = 1e-2,
    ) -> SpectralDeepClassifier:
        uniq = sorted(set(label_ids))
        idx = [uniq.index(lid) for lid in label_ids]
        y = one_hot(idx, len(uniq))
        h = np.asarray(x, dtype=np.float64)
        components: list[NDArray[np.float64]] = []
        means: list[NDArray[np.float64]] = []
        for dim in spectral_dims:
            mean = np.mean(h, axis=0)
            centered = h - mean
            _u, _s, vt = np.linalg.svd(centered, full_matrices=False)
            rank = min(dim, vt.shape[0])
            comp = vt[:rank]
            proj = centered @ comp.T
            h = np.hstack([proj, proj * proj, np.sqrt(np.abs(proj) + 1e-6)])
            components.append(comp)
            means.append(mean)
        readout = ridge_solve(append_bias(h), y, reg=reg)
        return cls(components, means, readout, uniq)

    def _forward(self, x: NDArray[np.float64]) -> NDArray[np.float64]:
        h = np.asarray(x, dtype=np.float64)
        for comp, mean in zip(self.components, self.means, strict=True):
            centered = h - mean
            proj = centered @ comp.T
            h = np.hstack([proj, proj * proj, np.sqrt(np.abs(proj) + 1e-6)])
        return append_bias(h)

    def predict_proba(self, x: NDArray[np.float64]) -> NDArray[np.float64]:
        logits = self._forward(x) @ self.readout
        return _softmax_rows(logits)


@dataclass
class KernelRidgeStackLinker:
    """Pairwise KV link scorer: shallow ridge vs deep kernel ridge stack."""

    shallow_w: NDArray[np.float64] | None
    deep_models: list[NystromKernelRidge]
    shallow_only: bool

    @classmethod
    def fit_shallow(
        cls,
        x: NDArray[np.float64],
        y: NDArray[np.float64],
        *,
        reg: float = 1e-2,
    ) -> KernelRidgeStackLinker:
        w = ridge_solve(append_bias(x), y.reshape(-1, 1), reg=reg)
        return cls(w, [], True)

    @classmethod
    def fit_deep(
        cls,
        x: NDArray[np.float64],
        y: NDArray[np.float64],
        *,
        n_landmarks: tuple[int, ...] = (64, 32),
        reg: float = 1e-2,
        seed: int = 0,
    ) -> KernelRidgeStackLinker:
        h = np.asarray(x, dtype=np.float64)
        models: list[NystromKernelRidge] = []
        targets = y.astype(np.float64)
        for i, m in enumerate(n_landmarks):
            model = NystromKernelRidge.fit(h, targets, n_landmarks=m, reg=reg, seed=seed + i)
            models.append(model)
            targets = model.predict(h)
            layer = RandomFeatureLayer.create(h.shape[1], min(96, h.shape[1] * 2), seed=seed + 10 + i)
            h = layer.transform(h)
        w = ridge_solve(append_bias(h), y.reshape(-1, 1), reg=reg)
        return cls(w, models, False)

    def predict_score(self, x: NDArray[np.float64]) -> NDArray[np.float64]:
        if self.shallow_w is not None and self.shallow_only:
            return (append_bias(x) @ self.shallow_w).reshape(-1)
        h = np.asarray(x, dtype=np.float64)
        for model in self.deep_models:
            h = model.predict(h).reshape(-1, 1)
            if h.shape[1] == 1 and h.shape[0] == x.shape[0]:
                h = np.hstack([x, h])
        if self.shallow_w is None:
            return np.zeros(x.shape[0])
        return (append_bias(h) @ self.shallow_w).reshape(-1)
