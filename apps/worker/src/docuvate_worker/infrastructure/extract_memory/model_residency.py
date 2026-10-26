# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Evictable ONNX/OCR model memory held by warm extract pool children."""

from __future__ import annotations

import os

from docuvate_worker.infrastructure.extract_memory.pool_memory import (
    pool_memory_registry,
    pool_resident_bytes_per_child,
)
from docuvate_worker.presentation.extract_subprocess_pool import evict_idle_pool_children

_ENV_KEEP_MODELS = "DOCUVATE_EXTRACT_KEEP_MODELS"
_ENV_CHILD_LOOP = "DOCUVATE_EXTRACT_CHILD_LOOP"


def extract_keep_models_resident() -> bool:
    """Keep inference models loaded across jobs (pooled extract child loop)."""
    raw = os.environ.get(_ENV_KEEP_MODELS, "").strip().casefold()
    if raw:
        return raw in {"1", "true", "yes", "on"}
    return os.environ.get(_ENV_CHILD_LOOP) == "1"


def evictable_pool_model_bytes() -> int:
    """RSS that can be reclaimed by terminating idle warm pool children."""
    if os.environ.get("DOCUVATE_EXTRACT_POOL", "0") != "1":
        return 0
    return pool_memory_registry().spawned_children() * pool_resident_bytes_per_child()


def reclaim_model_memory_for_admission() -> int:
    """Unload idle pool children to free cgroup memory; return estimated bytes reclaimed."""
    return evict_idle_pool_children(keep=0)


def default_pool_resident_bytes() -> int:
    return pool_resident_bytes_per_child()
