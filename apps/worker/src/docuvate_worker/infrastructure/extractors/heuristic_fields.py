# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from docuvate_worker.domain.models import ExtractedField
from docuvate_worker.infrastructure.extractors.field_extraction_context import (
    learned_value_types_enabled,
)
from docuvate_worker.infrastructure.extractors.heuristic_fields_legacy import (
    legacy_heuristic_field_suggestions,
)
from docuvate_worker.infrastructure.ml.value_types.field_suggestions import (
    learned_field_suggestions,
)


def heuristic_field_suggestions(text: str) -> list[ExtractedField]:
    """Global field hints; learned value types by default, legacy regex when flag is off."""
    if learned_value_types_enabled():
        return learned_field_suggestions(text)
    return legacy_heuristic_field_suggestions(text)


def heuristic_fields(text: str) -> list[ExtractedField]:
    """Backward-compatible alias; heuristics are suggestions only."""
    return heuristic_field_suggestions(text)
