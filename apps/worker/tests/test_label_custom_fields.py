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
    assert by_key["amount"] == "EUR 12,50"


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


def test_absender_from_kurzer_absender_line() -> None:
    text = "Rechnung Layout-Workspace Demo\nKurzer Absender: Demo Nord GmbH"
    fields = extract_label_custom_fields(
        text,
        tag_name="Rechnung",
        fields=[{"key": "absender", "label": "Absender", "field_type": "text"}],
    )
    by_key = {f.key: f.value for f in fields}
    assert by_key["absender"] == "Demo Nord GmbH"
