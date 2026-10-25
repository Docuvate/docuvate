# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Literal

import numpy as np
from numpy.typing import NDArray

from docuvate_worker.domain.math_stable import sigmoid
from docuvate_worker.infrastructure.ml.layout_kv_roles.features import (
    ENTITY_FEATURE_DIM,
    LINK_EXTRA_DIM,
)

RoleLabel = Literal["other", "key", "value"]

ROLE_INDEX: dict[RoleLabel, int] = {"other": 0, "key": 1, "value": 2}
INDEX_ROLE: dict[int, RoleLabel] = {idx: label for label, idx in ROLE_INDEX.items()}

DEFAULT_ARTIFACT = (
    Path(__file__).resolve().parent.parent / "artifacts" / "layout-kv-role-head.v1.json"
)


@dataclass(frozen=True)
class LayoutKvRoleHeadModel:
    version: int
    encoder_id: str
    encoder_revision: str
    role_weights: NDArray[np.float32]
    link_weights: NDArray[np.float32]
    role_min_confidence: float
    link_min_confidence: float
    training_seed: int
    training_data_manifest: tuple[str, ...]

    @property
    def role_class_count(self) -> int:
        return int(self.role_weights.shape[0])

    @property
    def role_feature_dim(self) -> int:
        return int(self.role_weights.shape[1] - 1)


def _softmax(logits: NDArray[np.float32]) -> NDArray[np.float32]:
    shifted = logits - np.max(logits)
    exp = np.exp(shifted)
    denom = float(np.sum(exp))
    if denom <= 0:
        uniform = np.ones_like(logits, dtype=np.float32) / float(len(logits))
        return uniform
    return np.asarray(exp / denom, dtype=np.float32)


def _parse_weights(raw: object, *, rows: int, cols: int, name: str) -> NDArray[np.float32]:
    if not isinstance(raw, list):
        msg = f"{name} must be a matrix"
        raise TypeError(msg)
    matrix = np.asarray(raw, dtype=np.float32)
    if matrix.shape != (rows, cols):
        msg = f"{name} shape {matrix.shape} != ({rows}, {cols})"
        raise ValueError(msg)
    return matrix


def load_layout_kv_role_head(path: Path | None = None) -> LayoutKvRoleHeadModel:
    artifact_path = path or DEFAULT_ARTIFACT
    payload = json.loads(artifact_path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        msg = "layout kv head artifact must be an object"
        raise TypeError(msg)
    version = payload.get("version")
    if version != 1:
        msg = f"unsupported layout kv head version: {version!r}"
        raise ValueError(msg)
    encoder_id = payload.get("encoder_id")
    encoder_revision = payload.get("encoder_revision")
    if not isinstance(encoder_id, str) or not isinstance(encoder_revision, str):
        msg = "encoder_id and encoder_revision must be strings"
        raise TypeError(msg)
    role_weights = _parse_weights(
        payload.get("role_weights"),
        rows=3,
        cols=ENTITY_FEATURE_DIM + 1,
        name="role_weights",
    )
    link_weights = _parse_weights(
        payload.get("link_weights"),
        rows=1,
        cols=ENTITY_FEATURE_DIM * 2 + LINK_EXTRA_DIM + 1,
        name="link_weights",
    )
    thresholds = payload.get("thresholds")
    if not isinstance(thresholds, dict):
        msg = "thresholds must be an object"
        raise TypeError(msg)
    role_min = thresholds.get("role_min_confidence")
    link_min = thresholds.get("link_min_confidence")
    if not isinstance(role_min, (int, float)) or not isinstance(link_min, (int, float)):
        msg = "threshold confidences must be numbers"
        raise TypeError(msg)
    training = payload.get("training")
    if not isinstance(training, dict):
        msg = "training metadata must be an object"
        raise TypeError(msg)
    seed = training.get("seed")
    manifest = training.get("data_manifest")
    if not isinstance(seed, int):
        msg = "training.seed must be int"
        raise TypeError(msg)
    if not isinstance(manifest, list) or not all(isinstance(item, str) for item in manifest):
        msg = "training.data_manifest must be string list"
        raise TypeError(msg)
    return LayoutKvRoleHeadModel(
        version=1,
        encoder_id=encoder_id,
        encoder_revision=encoder_revision,
        role_weights=role_weights,
        link_weights=link_weights,
        role_min_confidence=float(role_min),
        link_min_confidence=float(link_min),
        training_seed=seed,
        training_data_manifest=tuple(manifest),
    )


@lru_cache(maxsize=1)
def get_layout_kv_role_head() -> LayoutKvRoleHeadModel:
    return load_layout_kv_role_head()


def predict_role(
    model: LayoutKvRoleHeadModel,
    features: list[float],
) -> tuple[RoleLabel, float]:
    vector = np.asarray(features, dtype=np.float32)
    if vector.shape[0] != model.role_feature_dim:
        msg = f"role features dim {vector.shape[0]} != {model.role_feature_dim}"
        raise ValueError(msg)
    logits = np.empty(model.role_class_count, dtype=np.float32)
    for class_idx in range(model.role_class_count):
        row = model.role_weights[class_idx]
        logits[class_idx] = float(row[0] + np.dot(row[1:], vector))
    probs = _softmax(logits)
    best_idx = int(np.argmax(probs))
    label = INDEX_ROLE[best_idx]
    confidence = float(probs[best_idx])
    return label, confidence


def predict_link_probability(model: LayoutKvRoleHeadModel, features: list[float]) -> float:
    vector = np.asarray(features, dtype=np.float32)
    expected = model.link_weights.shape[1] - 1
    if vector.shape[0] != expected:
        msg = f"link features dim {vector.shape[0]} != {expected}"
        raise ValueError(msg)
    row = model.link_weights[0]
    logit = float(row[0] + np.dot(row[1:], vector))
    return sigmoid(logit)
