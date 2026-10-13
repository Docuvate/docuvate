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


def set_learned_value_types_enabled(enabled: bool | None) -> None:
    _learned_value_types_override.set(enabled)


def learned_value_types_enabled() -> bool:
    override = _learned_value_types_override.get()
    if override is not None:
        return override
    raw = os.environ.get("DOCUVATE_FEATURE_LEARNED_VALUE_TYPES", "true").strip().lower()
    return raw not in ("0", "false", "no")
