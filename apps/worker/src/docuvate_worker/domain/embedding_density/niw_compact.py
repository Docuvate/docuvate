# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Compact float32 storage for NIW sufficient statistics (memory-efficient)."""

from __future__ import annotations

import base64

import numpy as np
from numpy.typing import NDArray


def encode_f32_vector(vec: NDArray[np.float64]) -> str:
    arr = np.asarray(vec, dtype=np.float32)
    return base64.b64encode(arr.tobytes()).decode("ascii")


def decode_f32_vector(payload: str, dim: int) -> NDArray[np.float64]:
    raw = base64.b64decode(payload.encode("ascii"))
    arr = np.frombuffer(raw, dtype=np.float32)
    if arr.shape[0] != dim:
        raise ValueError("sum_x_f32 length mismatch")
    return np.asarray(arr, dtype=np.float64)


def encode_f32_matrix(mat: NDArray[np.float64]) -> str:
    arr = np.asarray(mat, dtype=np.float32)
    return base64.b64encode(arr.tobytes()).decode("ascii")


def decode_f32_matrix(payload: str, dim: int) -> NDArray[np.float64]:
    raw = base64.b64decode(payload.encode("ascii"))
    arr = np.frombuffer(raw, dtype=np.float32)
    if arr.shape[0] != dim * dim:
        raise ValueError("sum_xx_f32 length mismatch")
    return np.asarray(arr.reshape(dim, dim), dtype=np.float64)


def bytes_per_label(dim: int) -> int:
    """Documented memory: float32 sum_x (dim) + sum_xx (dim*dim)."""
    return 4 * dim + 4 * dim * dim
