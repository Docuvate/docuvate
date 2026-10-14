# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from docuvate_worker.infrastructure.extractors.field_extraction_context import (
    set_learned_value_types_enabled,
)
from docuvate_worker.infrastructure.extractors.heuristic_fields import heuristic_field_suggestions
from docuvate_worker.infrastructure.extractors.heuristic_fields_regex import (
    regex_heuristic_field_suggestions,
)

_SMOKE = (
    "Rechnung 2024-001\n"
    "Nordbeispiel Beratung GmbH\n"
    "Betrag: 1.240,00 EUR\n"
    "Fälligkeit: 15.03.2024"
)


def test_learned_matches_regex_on_smoke_receipt() -> None:
    set_learned_value_types_enabled(False)
    regex_fields = {f.key: f.value for f in regex_heuristic_field_suggestions(_SMOKE)}
    set_learned_value_types_enabled(True)
    learned = {f.key: f.value for f in heuristic_field_suggestions(_SMOKE)}
    set_learned_value_types_enabled(None)
    assert learned == regex_fields
