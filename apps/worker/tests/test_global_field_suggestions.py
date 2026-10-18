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


def test_holdout_eval_report_meets_precision_gates() -> None:
    import json
    from pathlib import Path

    report = json.loads(
        Path(__file__)
        .resolve()
        .parent.joinpath("fixtures/global_field_holdout_eval_report.v1.json")
        .read_text(encoding="utf-8")
    )
    target = float(report["target_precision"])
    for split_key in ("confirm_split", "eval_split"):
        for field in ("vendor", "amount"):
            metrics = report[split_key][field]
            assert metrics["precision"] >= target, (
                f"{split_key} {field} precision {metrics['precision']} < {target}"
            )
            assert metrics["expected_slots"] > 0

    frozen_v2_amount = report["frozen_eval_v2_split"]["amount"]
    assert frozen_v2_amount["precision"] >= target
    assert frozen_v2_amount["recall"] >= 0.70
    assert report.get("amount_frozen_eval_passed") is True

    frozen_v2_vendor = report["frozen_eval_v2_split"]["vendor"]
    assert frozen_v2_vendor["precision"] >= target
    assert frozen_v2_vendor["recall"] >= 0.60
    assert report.get("vendor_frozen_eval_passed") is True
    assert "frozen_eval_v2_split" in report
    assert "frozen_eval_split" in report
    assert isinstance(report.get("amount_pr_curve"), list)
    assert len(report["amount_pr_curve"]) > 10
