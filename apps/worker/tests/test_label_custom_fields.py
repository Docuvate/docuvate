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
