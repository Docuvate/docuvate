# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from enum import Enum

import numpy as np

from dsre_lib.constants import EMBED_DIM


class HeadKind(str, Enum):
    COSINE = "cosine"
    LINEAR = "linear"
    BILINEAR = "bilinear"
    RELATIONAL = "relational"


def cosine_scores(span: np.ndarray, query: np.ndarray) -> np.ndarray:
    return span @ query.reshape(-1, 1)


def build_features(
    span: np.ndarray,
    query: np.ndarray,
    layout: np.ndarray,
    kind: HeadKind,
) -> np.ndarray:
    """Build feature matrix [num_candidates, feat_dim]."""
    q = query.reshape(1, -1)
    s = span
    cos = cosine_scores(s, query).reshape(-1, 1)
    if kind == HeadKind.COSINE:
        return cos
    sq = s * q
    bias = np.ones((s.shape[0], 1), dtype=np.float32)
    if kind == HeadKind.LINEAR:
        return np.concatenate([s, cos, bias], axis=1)
    if kind == HeadKind.BILINEAR:
        return np.concatenate([s, cos, sq, bias], axis=1)
    if kind == HeadKind.RELATIONAL:
        cos_layout = cos * layout
        return np.concatenate([s, cos, sq, layout, cos_layout, bias], axis=1)
    msg = f"unknown head {kind}"
    raise ValueError(msg)


def feature_dim(kind: HeadKind) -> int:
    if kind == HeadKind.COSINE:
        return 1
    if kind == HeadKind.LINEAR:
        return EMBED_DIM + 2
    if kind == HeadKind.BILINEAR:
        return EMBED_DIM * 2 + 2
    if kind == HeadKind.RELATIONAL:
        return EMBED_DIM * 2 + 2 + 8
    msg = f"unknown head {kind}"
    raise ValueError(msg)
