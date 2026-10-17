# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Per-request toggles for field extraction (tenant feature flags from API)."""

from __future__ import annotations

import os
from contextvars import ContextVar

_learned_value_types_override: ContextVar[bool | None] = ContextVar(
    "learned_value_types_override",
    default=None,
)

_passage_vector_cache: ContextVar[dict[str, list[float]] | None] = ContextVar(
    "passage_vector_cache",
    default=None,
)


def set_learned_value_types_enabled(enabled: bool | None) -> None:
    _learned_value_types_override.set(enabled)


def clear_passage_vector_cache() -> None:
    _passage_vector_cache.set({})


def register_passage_vectors(mapping: dict[str, list[float]]) -> None:
    current = _passage_vector_cache.get()
    merged = dict(current or {})
    merged.update(mapping)
    _passage_vector_cache.set(merged)


def passage_vector_for_text(text: str) -> list[float] | None:
    stripped = text.strip()
    if not stripped:
        return None
    cache = _passage_vector_cache.get()
    if not cache:
        return None
    direct = cache.get(stripped)
    if direct is not None:
        return direct
    for key, vector in cache.items():
        if stripped in key or key in stripped:
            return vector
    return None


def learned_value_types_enabled() -> bool:
    override = _learned_value_types_override.get()
    if override is not None:
        return override
    raw = os.environ.get("DOCUVATE_FEATURE_LEARNED_VALUE_TYPES", "true").strip().lower()
    return raw not in ("0", "false", "no")
