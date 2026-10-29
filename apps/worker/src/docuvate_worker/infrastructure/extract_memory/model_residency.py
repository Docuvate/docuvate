# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Evictable ONNX/OCR model memory held by warm extract pool children."""

from __future__ import annotations

import os

from docuvate_worker.infrastructure.extract_memory.pool_memory import (
    pool_memory_registry,
    pool_resident_bytes_per_child,
)
from docuvate_worker.infrastructure.onnx_e5_encoder import release_onnx_encoder
from docuvate_worker.infrastructure.worker_memory_hygiene import reclaim_process_heap
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


def pool_child_running() -> bool:
    """True while a warm extract pool child holds memory that eviction could free."""
    if os.environ.get("DOCUVATE_EXTRACT_POOL", "0") != "1":
        return False
    return pool_memory_registry().spawned_children() > 0


def reclaim_model_memory_for_admission() -> int:
    """Unload idle pool children to free cgroup memory; return estimated bytes reclaimed."""
    return evict_idle_pool_children(keep=0)


def reclaim_idle_parent_memory() -> None:
    """Drop parent-held model caches and return freed native heap to the OS.

    Only called while no extract job runs, so nothing in the parent is using them;
    the encoder reloads lazily on the next representation request.
    """
    evict_idle_pool_children(keep=0)
    release_onnx_encoder()
    reclaim_process_heap()


def default_pool_resident_bytes() -> int:
    return pool_resident_bytes_per_child()
