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
            "Synthetic Nine Word Academic Title Case Example Heading",
            "Layout Regression Fixture Notes",
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


def test_correction_example_fills_missing_currency_field() -> None:
    text = "Entgeltnachweis\nBruttoentgelt\n3.500,00 EUR"
    fields = extract_label_custom_fields(
        text,
        tag_name="Dokument",
        fields=[{"key": "bruttoentgelt", "label": "Bruttoentgelt", "field_type": "currency"}],
        examples=[{"field_key": "bruttoentgelt", "value": "3.500,00", "label_tag_ids": []}],
    )
    assert any(row.key == "bruttoentgelt" and row.value == "3.500,00" for row in fields)


def test_correction_teaches_label_anchor_for_different_amounts() -> None:
    examples = [
        {"field_key": "bruttoentgelt", "value": "6.400,00", "label": "Bruttoentgelt", "label_tag_ids": []},
        {"field_key": "bruttoentgelt", "value": "4.859,67", "label": "Bruttoentgelt", "label_tag_ids": []},
    ]
    text_a = "Entgeltnachweis\nBruttoentgelt / Gesamtbrutto (EBeschV) 6.550,00"
    text_b = "Entgeltnachweis\n/10E Gesamtbrutto (EBeschV) 4.100,00 50.000,00"
    spec = [{"key": "bruttoentgelt", "label": "Bruttoentgelt", "field_type": "currency"}]
    rows_a = extract_label_custom_fields(text_a, tag_name="Entgeltnachweis", fields=spec, examples=examples)
    rows_b = extract_label_custom_fields(text_b, tag_name="Entgeltnachweis", fields=spec, examples=examples)
    assert {row.value for row in rows_a} == {"6.550,00"}
    assert {row.value for row in rows_b} == {"4.100,00"}
