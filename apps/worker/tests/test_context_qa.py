from docuvate_worker.infrastructure.chat.context_qa import (
    answer_from_document_context,
    retrieve_document_rag_context,
)


def test_sender_question_uses_structured_field() -> None:
    reply = answer_from_document_context(
        "Wer ist Absender?",
        title="SEPA Mandat",
        filename="mandat.pdf",
        text="Erteilung eines SEPA-Lastschriftmandats",
        fields=[{"key": "vendor", "value": "Gemeinde Messel"}],
    )
    assert "Gemeinde Messel" in reply


def test_sender_question_parses_ocr_line() -> None:
    reply = answer_from_document_context(
        "Wer ist der Zahlungsempfänger?",
        title="",
        filename="x.pdf",
        text="Name des Zahlungsempfängers: Landkreis Darmstadt-Dieburg",
        fields=[],
    )
    assert "Landkreis Darmstadt-Dieburg" in reply


def test_hybrid_rag_finds_amount_chunk() -> None:
    text = (
        "Rechnung Nr. 1001\n"
        "Position A 10 EUR\n"
        "Gesamtbetrag: 119,00 EUR inkl. MwSt.\n"
        "Zahlbar innerhalb 14 Tagen."
    )
    result = retrieve_document_rag_context(
        "Wie hoch ist der Rechnungsbetrag?",
        title="Rechnung",
        filename="inv.pdf",
        text=text,
        fields=[{"key": "amount", "value": "119,00 EUR"}],
    )
    assert any("Gesamtbetrag" in chunk for chunk in result.chunks)
    assert "Gesamtbetrag" in result.context_text
