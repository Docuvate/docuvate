from docuvate_worker.infrastructure.extractors.label_custom_fields import extract_label_custom_fields


def test_extract_near_label_and_amount():
    text = "Rechnung\nRechnungsdatum: 01.02.2024\nBetrag: EUR 12,50"
    fields = extract_label_custom_fields(
        text,
        tag_name="Rechnung",
        fields=[
            {"key": "invoice_date", "label": "Rechnungsdatum", "field_type": "date"},
            {"key": "amount", "label": "Betrag", "field_type": "currency"},
        ],
    )
    by_key = {f.key: f.value for f in fields}
    assert by_key["invoice_date"] == "01.02.2024"
    assert by_key["amount"] == "12,50"


def test_absender_strips_doubled_label_prefix() -> None:
    text = "Absender: Kurzer Absender: Demo Nord GmbH\nBruttobetrag: 12.500,00 EUR"
    fields = extract_label_custom_fields(
        text,
        tag_name="Rechnung",
        fields=[{"key": "absender", "label": "Absender", "field_type": "text"}],
    )
    by_key = {f.key: f.value for f in fields}
    assert by_key["absender"] == "Demo Nord GmbH"


def test_multiline_absender_address_block() -> None:
    text = "\n".join(
        [
            "Rechnung",
            "Absender: Nordwind GmbH",
            "Marktplatz 3",
            "20095 Hamburg",
            "Betrag: EUR 10,00",
        ]
    )
    fields = extract_label_custom_fields(
        text,
        tag_name="Rechnung",
        fields=[{"key": "absender", "label": "Absender", "field_type": "text"}],
    )
    by_key = {f.key: f.value for f in fields}
    assert by_key["absender"] == "Nordwind GmbH Marktplatz 3 20095 Hamburg"


def test_invoice_vendor_suggestion_fixture_date_and_amount() -> None:
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
    fields = extract_label_custom_fields(
        text,
        tag_name="Rechnung",
        fields=[
            {"key": "rechnungsdatum", "label": "Rechnungsdatum", "field_type": "date"},
            {"key": "betrag", "label": "Betrag", "field_type": "currency"},
        ],
    )
    by_key = {f.key: f.value for f in fields}
    assert by_key["rechnungsdatum"] == "15.03.2026"
    assert by_key["betrag"] == "12.500,00"


def test_absender_from_kurzer_absender_line() -> None:
    text = "Rechnung Layout-Workspace Demo\nKurzer Absender: Demo Nord GmbH"
    fields = extract_label_custom_fields(
        text,
        tag_name="Rechnung",
        fields=[{"key": "absender", "label": "Absender", "field_type": "text"}],
    )
    by_key = {f.key: f.value for f in fields}
    assert by_key["absender"] == "Demo Nord GmbH"
