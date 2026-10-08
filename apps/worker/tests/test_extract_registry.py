import os

import pytest

from docuvate_worker.infrastructure.extractors.heuristic_fields import heuristic_fields
from docuvate_worker.infrastructure.extractors.registry import build_extractor


def test_heuristic_fields_amount_and_date() -> None:
    text = "Acme GmbH\nRechnung\nEUR 99,00\nDatum 01.02.2024"
    fields = {f.key: f.value for f in heuristic_fields(text)}
    assert fields["amount"] == "99.00"
    assert fields["date"] == "01.02.2024"
    assert fields["vendor"].startswith("Acme")


def test_heuristic_fields_german_invoice_layout() -> None:
    text = (
        "Rechnung 2024-001\n"
        "Nordbeispiel Beratung GmbH\n"
        "Betrag: 1.240,00 EUR\n"
        "Fälligkeit: 15.03.2024"
    )
    fields = {f.key: f.value for f in heuristic_fields(text)}
    assert fields["amount"] == "1240.00"
    assert fields["date"] == "15.03.2024"
    assert fields["vendor"] == "Nordbeispiel Beratung GmbH"


def test_default_engine_is_pipeline() -> None:
    os.environ.pop("EXTRACTOR_ENGINE", None)
    engine = build_extractor()
    assert engine.name == "pipeline"


def test_tesseract_engine_requires_extra(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("EXTRACTOR_ENGINE", "tesseract")
    engine = build_extractor()
    assert engine.name == "tesseract"
