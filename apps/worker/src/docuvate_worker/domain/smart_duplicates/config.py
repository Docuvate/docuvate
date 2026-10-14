# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SmartDuplicateConfig:
    """Tuned on dev split (benchmark F1 ≈ 0.86); overridable via worker request."""

    alpha: float = 0.5
    delta: float = 0.05
    threshold: float = 0.55
    shingle_size: int = 4
    minhash_perm: int = 128


DEFAULT_SMART_DUPLICATE_CONFIG = SmartDuplicateConfig()
