# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

import hashlib
from typing import Final

_MERSENNE: Final = (1 << 61) - 1


def _hash64(data: bytes, seed: int) -> int:
    digest = hashlib.blake2b(data, digest_size=8, person=seed.to_bytes(2, 'little')).digest()
    return int.from_bytes(digest, 'little') & _MERSENNE


def minhash_signature(items: set[str], *, num_perm: int) -> tuple[int, ...]:
    if not items:
        return tuple(_MERSENNE for _ in range(num_perm))
    signature: list[int] = []
    for seed in range(num_perm):
        minimum = _MERSENNE
        for item in items:
            hashed = _hash64(item.encode('utf-8'), seed)
            minimum = min(minimum, hashed)
        signature.append(minimum)
    return tuple(signature)


def minhash_jaccard_estimate(left: tuple[int, ...], right: tuple[int, ...]) -> float:
    if len(left) != len(right) or len(left) == 0:
        return 0.0
    matches = sum(1 for a, b in zip(left, right, strict=True) if a == b)
    return matches / len(left)
