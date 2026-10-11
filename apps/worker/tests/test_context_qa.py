from docuvate_worker.infrastructure.chat.context_qa import (
    EXTRACTIVE_ABSTAIN_NO_PASSAGE,
    answer_from_document_context,
    extractive_answer_abstained,
    retrieve_document_rag_context,
)

_LEASE_EXCERPT = (
    "Mietvertrag Lindenweg 5. Die Kaltmiete beträgt 945 EUR monatlich. "
    "Kündigung mit drei Monaten Frist zum Monatsende. "
    "Miete zahlbar bis zum 3. Werktag eines Monats."
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


def test_extractive_abstain_helper_detects_no_passage() -> None:
    assert extractive_answer_abstained(f"{EXTRACTIVE_ABSTAIN_NO_PASSAGE}.")


def test_paraphrased_lease_questions_are_answered() -> None:
    for question in (
        "Wie lange ist die Kündigungsfrist?",
        "Wann kann ich den Vertrag kündigen?",
        "Wie viel muss ich monatlich zahlen?",
    ):
        reply = answer_from_document_context(
            question,
            title="Mietvertrag",
            filename="miete.pdf",
            text=_LEASE_EXCERPT,
            fields=[],
        )
        assert not extractive_answer_abstained(reply)
        assert "Zu „" in reply


def test_weak_retrieval_abstains_via_threshold() -> None:
    reply = answer_from_document_context(
        "Wie wird das Wetter am Wochenende in Reykjavík?",
        title="Rechnung",
        filename="inv.pdf",
        text="Rechnungsnummer RN-9. Gesamtsumme 12,00 EUR.",
        fields=[],
    )
    assert extractive_answer_abstained(reply)
