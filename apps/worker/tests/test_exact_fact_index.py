# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from docuvate_worker.domain.cpu_pipeline.contracts import TacoStageData
from docuvate_worker.domain.exact_fact_index.build import build_exact_fact_index
from docuvate_worker.domain.exact_fact_index.value_transducers import parse_amount, parse_iso_date
from docuvate_worker.domain.models import ExtractionBlock


def test_parse_amount_german_eur_suffix() -> None:
    parsed = parse_amount("1.234,56 EUR")
    assert parsed is not None
    assert abs(parsed.amount - 1234.56) < 0.001
    assert parsed.currency_code == "EUR"


def test_parse_iso_date_dmy() -> None:
    assert parse_iso_date("03.03.2026") == "2026-03-03"


def test_key_value_fact_has_provenance_span() -> None:
    text = "Rechnung\nKündigungsfrist: 3 Monate\nBetrag: 10,00 EUR\n"
    blocks = (
        ExtractionBlock(
            page=1,
            x=0.1,
            y=0.2,
            width=0.5,
            height=0.05,
            text="Kündigungsfrist: 3 Monate",
            block_index=0,
        ),
    )
    built = build_exact_fact_index(
        text=text,
        blocks=blocks,
        content=b"",
        mime_type="text/plain",
        taco=TacoStageData(tables=()),
    )
    assert len(built.facts) >= 2
    by_key = {f.predicate_key: f for f in built.facts}
    assert "kündigungsfrist" in by_key
    frist = by_key["kündigungsfrist"]
    assert frist.kind == "key_value"
    assert frist.provenance.char_start is not None
    assert frist.provenance.char_end is not None
    assert frist.provenance.page == 1
    amount = by_key.get("betrag")
    assert amount is not None
    assert amount.kind == "amount"
    assert amount.amount_numeric is not None
    assert abs(amount.amount_numeric - 10.0) < 0.001
