# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Smoke gate: learned value types on a fixed synthetic receipt fixture."""

from __future__ import annotations

from docuvate_worker.infrastructure.extractors.heuristic_fields import heuristic_field_suggestions

from bench.model_gates.schema import GateRunResult, MetricValue

_SMOKE_TEXT = (
    "Rechnung 2024-001\n"
    "Nordbeispiel Beratung GmbH\n"
    "Betrag: 1.240,00 EUR\n"
    "Fälligkeit: 15.03.2024"
)

_EXPECTED = {
    "amount": "1240.00",
    "date": "15.03.2024",
    "vendor": "Nordbeispiel Beratung GmbH",
}


def run_value_types_smoke_gate() -> GateRunResult:
    fields = {f.key: f.value for f in heuristic_field_suggestions(_SMOKE_TEXT)}
    matched = sum(1 for key, value in _EXPECTED.items() if fields.get(key) == value)
    coverage = matched / len(_EXPECTED)
    metrics = (
        MetricValue(
            name="value_types_smoke_field_recall",
            value=coverage,
            direction="higher_is_better",
        ),
    )
    if coverage >= 1.0:
        return GateRunResult(
            gate_id="fields",
            status="pass",
            metrics=metrics,
            detail="Learned value types extract all smoke receipt fields",
        )
    return GateRunResult(
        gate_id="fields",
        status="fail",
        metrics=metrics,
        detail=f"Smoke receipt mismatch expected={_EXPECTED!r} got={fields!r}",
    )
