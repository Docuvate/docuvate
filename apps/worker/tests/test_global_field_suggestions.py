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


def test_acme_invoice_amount_date_and_vendor() -> None:
    text = "Acme GmbH\nRechnung\nEUR 99,00\nDatum 01.02.2024"
    fields = {f.key: f.value for f in heuristic_field_suggestions(text)}
    assert fields.get("amount") == "99.00"
    assert fields.get("date") == "01.02.2024"
    assert fields.get("vendor") == "Acme GmbH"


def test_holdout_eval_vendor_recall_floor() -> None:
    import json
    from pathlib import Path

    holdout = json.loads(
        Path(__file__).resolve().parent.joinpath("fixtures/global_field_holdout.v1.json").read_text(
            encoding="utf-8"
        )
    )
    eval_docs = [doc for doc in holdout["documents"] if doc.get("split") == "eval"]
    tp = fn = 0
    for doc in eval_docs:
        expected = doc.get("expected", {})
        if "vendor" not in expected:
            continue
        predicted = {f.key: f.value for f in heuristic_field_suggestions(str(doc["text"]))}
        if predicted.get("vendor") == expected["vendor"]:
            tp += 1
        else:
            fn += 1
    recall = 1.0 if tp + fn == 0 else tp / (tp + fn)
    assert recall >= 0.75
