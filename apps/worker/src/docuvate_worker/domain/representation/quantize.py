# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Float embedding → int8 + binary sketch (fixed rotation)."""

from __future__ import annotations

import struct

import numpy as np

from docuvate_worker.domain.representation.constants import BINARY_CODE_BYTES, EMBEDDING_DIM

# Versioned pseudo-random rotation (orthogonal via QR); stable across processes.
_RNG = np.random.default_rng(20261012 + 1)
_R_MATRIX = np.linalg.qr(_RNG.standard_normal((EMBEDDING_DIM, EMBEDDING_DIM)))[0].astype(np.float32)


def quantize_vector(vector: list[float] | np.ndarray) -> tuple[float, bytes]:
    arr = np.asarray(vector, dtype=np.float32).reshape(-1)
    if arr.shape[0] != EMBEDDING_DIM:
        msg = f"expected dim {EMBEDDING_DIM}, got {arr.shape[0]}"
        raise ValueError(msg)
    peak = float(np.max(np.abs(arr)))
    scale = peak / 127.0 if peak > 0 else 1.0
    quantized = np.clip(np.round(arr / scale), -127, 127).astype(np.int8)
    return scale, quantized.tobytes()


def binary_code(vector: list[float] | np.ndarray) -> bytes:
    arr = np.asarray(vector, dtype=np.float32).reshape(-1)
    if arr.shape[0] != EMBEDDING_DIM:
        msg = f"expected dim {EMBEDDING_DIM}, got {arr.shape[0]}"
        raise ValueError(msg)
    rotated = _R_MATRIX @ arr
    bits = (rotated >= 0).astype(np.uint8)
    packed = np.packbits(bits)
    if packed.nbytes != BINARY_CODE_BYTES:
        msg = f"packed binary code size {packed.nbytes} != {BINARY_CODE_BYTES}"
        raise ValueError(msg)
    return packed.tobytes()


def dequantize_vector(scale: float, data: bytes) -> np.ndarray:
    raw = np.frombuffer(data, dtype=np.int8)
    return raw.astype(np.float32) * scale


def hamming_distance(a: bytes, b: bytes) -> int:
    if len(a) != len(b):
        msg = "binary codes must have equal length"
        raise ValueError(msg)
    av = np.frombuffer(a, dtype=np.uint8)
    bv = np.frombuffer(b, dtype=np.uint8)
    return int(np.sum(np.unpackbits(av ^ bv)))


def int8_dot(scale_a: float, bytes_a: bytes, scale_b: float, bytes_b: bytes) -> float:
    va = np.frombuffer(bytes_a, dtype=np.int8).astype(np.float32)
    vb = np.frombuffer(bytes_b, dtype=np.int8).astype(np.float32)
    return float(scale_a * scale_b * np.dot(va, vb))


def aggregate_document_vectors(vectors: list[list[float]]) -> tuple[list[float], list[float]]:
    if not vectors:
        zeros = [0.0] * EMBEDDING_DIM
        return zeros, zeros
    mat = np.asarray(vectors, dtype=np.float32)
    mean = mat.mean(axis=0)
    max_v = mat.max(axis=0)
    return mean.tolist(), max_v.tolist()


def pack_scale(scale: float) -> bytes:
    return struct.pack("<f", scale)
