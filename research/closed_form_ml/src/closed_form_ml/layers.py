# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Layer-wise closed-form building blocks (ridge, random features, Nyström kernel ridge)."""

from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray


def ridge_solve(
    x: NDArray[np.float64],
    y: NDArray[np.float64],
    *,
    reg: float = 1e-2,
) -> NDArray[np.float64]:
    """Closed-form ridge: W = (X'X + λI)^{-1} X'Y. X may include bias column."""
    x = np.asarray(x, dtype=np.float64)
    y = np.asarray(y, dtype=np.float64)
    if x.ndim != 2:
        msg = "x must be 2D"
        raise ValueError(msg)
    d = x.shape[1]
    xtx = x.T @ x
    xtx.flat[:: d + 1] += reg
    try:
        return np.linalg.solve(xtx, x.T @ y)
    except np.linalg.LinAlgError:
        return np.linalg.lstsq(xtx, x.T @ y, rcond=None)[0]


def one_hot(labels: list[int], num_classes: int) -> NDArray[np.float64]:
    y = np.zeros((len(labels), num_classes), dtype=np.float64)
    for row, label in enumerate(labels):
        if 0 <= label < num_classes:
            y[row, label] = 1.0
    return y


def append_bias(x: NDArray[np.float64]) -> NDArray[np.float64]:
    ones = np.ones((x.shape[0], 1), dtype=np.float64)
    return np.hstack([ones, x])


@dataclass
class RandomFeatureLayer:
    """Fixed random projection + tanh (ELM-style), trainable readout via ridge only."""

    input_dim: int
    hidden_dim: int
    seed: int
    weights: NDArray[np.float64]
    bias: NDArray[np.float64]

    @classmethod
    def create(cls, input_dim: int, hidden_dim: int, *, seed: int) -> RandomFeatureLayer:
        rng = np.random.default_rng(seed)
        scale = 1.0 / math.sqrt(max(input_dim, 1))
        w = rng.normal(0, scale, size=(input_dim, hidden_dim))
        b = rng.uniform(-math.pi, math.pi, size=(hidden_dim,))
        return cls(input_dim, hidden_dim, seed, w.astype(np.float64), b.astype(np.float64))

    def transform(self, x: NDArray[np.float64]) -> NDArray[np.float64]:
        z = x @ self.weights + self.bias
        return np.tanh(z)


@dataclass
class PcaScatterLayer:
    """PCANet-style: PCA whitening on features then fixed second-order scatter."""

    components: NDArray[np.float64]
    mean: NDArray[np.float64]

    @classmethod
    def fit(cls, x: NDArray[np.float64], *, n_components: int) -> PcaScatterLayer:
        x = np.asarray(x, dtype=np.float64)
        mean = np.mean(x, axis=0)
        centered = x - mean
        _u, _s, vt = np.linalg.svd(centered, full_matrices=False)
        rank = min(n_components, vt.shape[0])
        components = vt[:rank]
        return cls(components, mean)

    def transform(self, x: NDArray[np.float64]) -> NDArray[np.float64]:
        centered = np.asarray(x, dtype=np.float64) - self.mean
        proj = centered @ self.components.T
        return np.hstack([proj, proj * proj])


@dataclass
class NystromKernelRidge:
    """Nyström approximate kernel ridge for medium-scale retrieval reranking."""

    landmarks: NDArray[np.float64]
    weights: NDArray[np.float64]
    bandwidth: float
    reg: float

    @staticmethod
    def _rbf(a: NDArray[np.float64], b: NDArray[np.float64], bandwidth: float) -> NDArray[np.float64]:
        diff = a[:, None, :] - b[None, :, :]
        sq = np.sum(diff * diff, axis=2)
        h2 = max(bandwidth * bandwidth, 1e-12)
        return np.exp(-0.5 * sq / h2)

    @classmethod
    def fit(
        cls,
        x: NDArray[np.float64],
        y: NDArray[np.float64],
        *,
        n_landmarks: int,
        bandwidth: float = 0.5,
        reg: float = 1e-2,
        seed: int = 0,
    ) -> NystromKernelRidge:
        x = np.asarray(x, dtype=np.float64)
        y = np.asarray(y, dtype=np.float64).reshape(-1, 1)
        n = x.shape[0]
        m = min(n_landmarks, n)
        rng = np.random.default_rng(seed)
        idx = rng.choice(n, size=m, replace=False)
        landmarks = x[idx]
        knm = cls._rbf(x, landmarks, bandwidth)
        kmm = cls._rbf(landmarks, landmarks, bandwidth)
        kmm.flat[:: m + 1] += reg
        alpha = ridge_solve(kmm, np.eye(m), reg=0.0) @ (knm.T @ y)
        weights = alpha.reshape(-1)
        return cls(landmarks, weights, bandwidth, reg)

    def predict(self, x: NDArray[np.float64]) -> NDArray[np.float64]:
        knm = self._rbf(np.asarray(x, dtype=np.float64), self.landmarks, self.bandwidth)
        return (knm @ self.weights.reshape(-1, 1)).reshape(-1)


@dataclass
class DeepRidgeStack:
    """Stack: [optional PCA scatter] → random tanh → ridge readout (multiclass)."""

    layers: list[RandomFeatureLayer]
    readout: NDArray[np.float64]
    pca: PcaScatterLayer | None
    label_ids: list[str]

    @classmethod
    def fit(
        cls,
        x: NDArray[np.float64],
        label_ids: list[str],
        *,
        hidden_dims: tuple[int, ...] = (256, 128),
        use_pca: bool = True,
        pca_dim: int = 64,
        reg: float = 1e-2,
        seed: int = 42,
    ) -> DeepRidgeStack:
        uniq = sorted(set(label_ids))
        label_to_idx = {lid: i for i, lid in enumerate(uniq)}
        y_idx = [label_to_idx[lid] for lid in label_ids]
        y = one_hot(y_idx, len(uniq))
        feats = np.asarray(x, dtype=np.float64)
        pca_layer: PcaScatterLayer | None = None
        if use_pca and feats.shape[0] >= pca_dim + 2:
            pca_layer = PcaScatterLayer.fit(feats, n_components=pca_dim)
            feats = pca_layer.transform(feats)
        layers: list[RandomFeatureLayer] = []
        in_dim = feats.shape[1]
        rng_seed = seed
        h = feats
        for hidden in hidden_dims:
            layer = RandomFeatureLayer.create(in_dim, hidden, seed=rng_seed)
            rng_seed += 1
            h = layer.transform(h)
            layers.append(layer)
            in_dim = hidden
        h_bias = append_bias(h)
        w = ridge_solve(h_bias, y, reg=reg)
        return cls(layers, w, pca_layer, uniq)

    def _forward(self, x: NDArray[np.float64]) -> NDArray[np.float64]:
        h = np.asarray(x, dtype=np.float64)
        if self.pca is not None:
            h = self.pca.transform(h)
        for layer in self.layers:
            h = layer.transform(h)
        return append_bias(h)

    def predict_proba(self, x: NDArray[np.float64]) -> NDArray[np.float64]:
        logits = self._forward(x) @ self.readout
        logits = logits - np.max(logits, axis=1, keepdims=True)
        exp = np.exp(logits)
        return exp / np.sum(exp, axis=1, keepdims=True)
