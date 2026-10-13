# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Smoke gate: learned value types vs regex parity on a fixed receipt fixture."""

from __future__ import annotations

from docuvate_worker.infrastructure.extractors.field_extraction_context import (
    set_learned_value_types_enabled,
)
from docuvate_worker.infrastructure.extractors.heuristic_fields import heuristic_field_suggestions

from bench.model_gates.schema import GateRunResult, MetricValue

_SMOKE_TEXT = (
    "Rechnung 2024-001\n"
    "Nordbeispiel Beratung GmbH\n"
    "Betrag: 1.240,00 EUR\n"
    "Fälligkeit: 15.03.2024"
)


def _field_map(text: str, *, learned: bool) -> dict[str, str]:
    set_learned_value_types_enabled(learned)
    return {f.key: f.value for f in heuristic_field_suggestions(text)}


def run_value_types_smoke_gate() -> GateRunResult:
    regex_fields = _field_map(_SMOKE_TEXT, learned=False)
    learned = _field_map(_SMOKE_TEXT, learned=True)
    set_learned_value_types_enabled(None)

    parity = regex_fields == learned
    metrics = (
        MetricValue(
            name="value_types_smoke_parity",
            value=1.0 if parity else 0.0,
            direction="higher_is_better",
        ),
    )
    if parity:
        return GateRunResult(
            gate_id="fields",
            status="pass",
            metrics=metrics,
            detail="Learned value types match regex output on smoke receipt",
        )
    return GateRunResult(
        gate_id="fields",
        status="fail",
        metrics=metrics,
        detail=f"Parity mismatch regex={regex_fields!r} learned={learned!r}",
    )
