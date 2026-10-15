# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
from numpy.typing import NDArray

from closed_form_ml.embeddings import embed_passages, l2_normalize
from closed_form_ml.interfaces import ClassifierResult
from closed_form_ml.layers import DeepRidgeStack, append_bias, one_hot, ridge_solve


@dataclass
class RidgeE5Classifier:
    """Multiclass ridge on frozen e5-small document embeddings."""

    label_ids: list[str] = field(default_factory=list)
    weights: NDArray[np.float64] | None = None
    reject_threshold: float = 0.14
    _train_matrix: NDArray[np.float64] | None = field(default=None, repr=False)

    def fit_vectors(self, x: NDArray[np.float64], label_ids: list[str]) -> None:
        self.label_ids = sorted(set(label_ids))
        label_to_idx = {lid: i for i, lid in enumerate(self.label_ids)}
        y_idx = [label_to_idx[lid] for lid in label_ids]
        x = l2_normalize(np.asarray(x, dtype=np.float64))
        y = one_hot(y_idx, len(self.label_ids))
        self.weights = ridge_solve(append_bias(x), y, reg=1e-2)
        self._train_matrix = x

    def fit(self, texts: list[str], label_ids: list[str]) -> None:
        self.fit_vectors(embed_passages(texts), label_ids)

    def predict_vector(self, vector: NDArray[np.float64]) -> ClassifierResult:
        if self.weights is None:
            msg = "classifier not fit"
            raise RuntimeError(msg)
        x = l2_normalize(np.asarray(vector, dtype=np.float64).reshape(1, -1))
        probs = (append_bias(x) @ self.weights).reshape(-1)
        probs = np.exp(probs - np.max(probs))
        probs = probs / np.sum(probs)
        idx = int(np.argmax(probs))
        conf = float(probs[idx])
        scores = {self.label_ids[i]: float(probs[i]) for i in range(len(self.label_ids))}
        rejected = conf < self.reject_threshold
        label = None if rejected else self.label_ids[idx]
        return ClassifierResult(label, conf, rejected, scores)

    def predict(self, text: str) -> ClassifierResult:
        return self.predict_vector(embed_passages([text])[0])


@dataclass
class DeepStackE5Classifier:
    """Deep random-feature stack + ridge (closed-form per layer)."""

    stack: DeepRidgeStack | None = None
    reject_threshold: float = 0.14

    def fit_vectors(self, x: NDArray[np.float64], label_ids: list[str]) -> None:
        x = l2_normalize(np.asarray(x, dtype=np.float64))
        self.stack = DeepRidgeStack.fit(
            x,
            label_ids,
            hidden_dims=(192, 96),
            use_pca=True,
            pca_dim=48,
            reg=5e-3,
            seed=7,
        )

    def fit(self, texts: list[str], label_ids: list[str]) -> None:
        self.fit_vectors(embed_passages(texts), label_ids)

    def predict_vector(self, vector: NDArray[np.float64]) -> ClassifierResult:
        if self.stack is None:
            msg = "classifier not fit"
            raise RuntimeError(msg)
        x = l2_normalize(np.asarray(vector, dtype=np.float64).reshape(1, -1))
        probs = self.stack.predict_proba(x).reshape(-1)
        idx = int(np.argmax(probs))
        conf = float(probs[idx])
        scores = {self.stack.label_ids[i]: float(probs[i]) for i in range(len(self.stack.label_ids))}
        rejected = conf < self.reject_threshold
        label = None if rejected else self.stack.label_ids[idx]
        return ClassifierResult(label, conf, rejected, scores)

    def predict(self, text: str) -> ClassifierResult:
        return self.predict_vector(embed_passages([text])[0])


@dataclass
class NestAdapterClassifier:
    """Wraps worker NEST (NIW) training for benchmark parity."""

    state_payload: dict | None = None
    reject_threshold: float = 0.35

    def fit_vectors(self, x: NDArray[np.float64], label_ids: list[str]) -> None:
        from docuvate_worker.application.embedding_density import train_from_labeled_examples  # noqa: PLC0415

        vectors = np.asarray(x, dtype=np.float64).tolist()
        payload = train_from_labeled_examples(sorted(set(label_ids)), vectors, label_ids)
        self.state_payload = payload.model_dump()

    def fit(self, texts: list[str], label_ids: list[str]) -> None:
        self.fit_vectors(embed_passages(texts), label_ids)

    def predict_vector(self, vector: NDArray[np.float64]) -> ClassifierResult:
        from docuvate_worker.application.embedding_density import classify_embedding  # noqa: PLC0415
        from docuvate_worker.domain.embedding_density.schemas import EmbeddingDensityStatePayload  # noqa: PLC0415

        if self.state_payload is None:
            msg = "classifier not fit"
            raise RuntimeError(msg)
        payload = EmbeddingDensityStatePayload.model_validate(self.state_payload)
        vec = np.asarray(vector, dtype=np.float64).tolist()
        decision = classify_embedding(payload, vec)
        label = decision.label_id
        conf = float(decision.confidence or 0.0)
        rejected = label is None or conf < self.reject_threshold
        scores = dict(decision.posterior or {})
        return ClassifierResult(label if not rejected else None, conf, rejected, scores)

    def predict(self, text: str) -> ClassifierResult:
        return self.predict_vector(embed_passages([text])[0])
