from docuvate_worker.infrastructure.extractors.field_value_multiline import (
    extract_multiline_value_after_label,
    join_wrapped_value_lines,
)


def test_join_wrapped_title_lines() -> None:
    value = join_wrapped_value_lines(
        "Closed-Form Document Layout Classification",
        ["with Certified Coarse-to-Fine Abstention"],
    )
    assert value == (
        "Closed-Form Document Layout Classification "
        "with Certified Coarse-to-Fine Abstention"
    )


def test_join_wrapped_amount_with_currency_line() -> None:
    value = join_wrapped_value_lines("12.500,00", ["EUR"])
    assert value == "12.500,00 EUR"


def test_rechnungsdatum_does_not_swallow_following_lines() -> None:
    text = "\n".join(
        [
            "Rechnung Demo",
            "Rechnungsnummer: INV-2026-0042",
            "Rechnungsdatum: 15.03.2026",
            "Closed-Form Document Layout Classification",
            "with Certified Coarse-to-Fine Abstention",
            "Thomas Faust",
            "Kurzer Absender: Demo Nord GmbH",
            "Bruttobetrag: 12.500,00 EUR",
        ]
    )
    value = extract_multiline_value_after_label(
        text,
        "Rechnungsdatum",
        stop_labels=("Rechnungsnummer", "Betrag", "Bruttobetrag"),
        allow_continuation=False,
    )
    assert value == "15.03.2026"


def test_multiline_address_stops_at_next_label() -> None:
    text = "\n".join(
        [
            "Absender: Muster GmbH",
            "Hauptstraße 12",
            "12345 Berlin",
            "Betrag: 99,00 EUR",
        ]
    )
    value = extract_multiline_value_after_label(
        text,
        "Absender",
        stop_labels=("Betrag",),
    )
    assert value == "Muster GmbH Hauptstraße 12 12345 Berlin"
