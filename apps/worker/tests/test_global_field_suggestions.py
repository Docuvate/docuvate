# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import importlib.util

import pytest

from docuvate_worker.infrastructure.extractors.heuristic_fields import heuristic_field_suggestions


def test_regex_heuristic_module_removed() -> None:
    spec = importlib.util.find_spec(
        "docuvate_worker.infrastructure.extractors.heuristic_fields_regex"
    )
    assert spec is None


def test_smoke_receipt_ml_extracts_core_fields() -> None:
    text = (
        "Rechnung 2024-001\n"
        "Nordbeispiel Beratung GmbH\n"
        "Betrag: 1.240,00 EUR\n"
        "Fälligkeit: 15.03.2024"
    )
    fields = {f.key: f.value for f in heuristic_field_suggestions(text)}
    assert fields["amount"] == "1240.00"
    assert fields["date"] == "15.03.2024"
    assert fields["vendor"] == "Nordbeispiel Beratung GmbH"


def test_landscape_heading_abstains(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DOCUVATE_FEATURE_LEARNED_VALUE_TYPES", "true")
    text = "QUERFORMAT-FIXTURE 842x595\nLandscape-only content row A"
    fields = {f.key: f.value for f in heuristic_field_suggestions(text)}
    assert fields == {}


def test_learned_value_types_flag_off_abstains(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DOCUVATE_FEATURE_LEARNED_VALUE_TYPES", "false")
    text = "Acme GmbH\nRechnung\nEUR 99,00\nDatum 01.02.2024"
    assert heuristic_field_suggestions(text) == []


def test_acme_invoice_amount_and_date_without_vendor_guess() -> None:
    """ML covers amount/date; vendor abstains where the model gate rejects promotion."""
    text = "Acme GmbH\nRechnung\nEUR 99,00\nDatum 01.02.2024"
    fields = {f.key: f.value for f in heuristic_field_suggestions(text)}
    assert fields.get("amount") == "99.00"
    assert fields.get("date") == "01.02.2024"
    assert "vendor" not in fields
