# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from docuvate_worker.domain.models import ExtractedField
from docuvate_worker.infrastructure.extractors.field_extraction_context import (
    learned_value_types_enabled,
)
from docuvate_worker.infrastructure.ml.value_types.field_suggestions import (
    learned_field_suggestions,
)


def heuristic_field_suggestions(text: str) -> list[ExtractedField]:
    """Global field hints from learned value-type models; abstains when the feature is off."""
    if not learned_value_types_enabled():
        return []
    return learned_field_suggestions(text)


def heuristic_fields(text: str) -> list[ExtractedField]:
    """Backward-compatible alias; suggestions only (never overwrites confirmed values upstream)."""
    return heuristic_field_suggestions(text)
