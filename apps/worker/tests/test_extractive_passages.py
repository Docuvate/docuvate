from docuvate_worker.infrastructure.chat.context_qa import extractive_answer_from_passages


def test_extractive_answer_from_passages_picks_sentence() -> None:
    pid = "chunk-1"
    text = "Einleitung. Die Miete ist bis zum 3. Werktag fällig."
    result = extractive_answer_from_passages("Wann ist die Miete fällig?", [(pid, text)])
    assert result is not None
    assert result.passage_id == pid
    assert "3. Werktag" in result.answer


def test_extractive_answer_from_passages_picks_best_across_passages() -> None:
    generic = (
        "chunk-generic",
        "Mietvertrag Wohnung\nDie Miete ist bis zum 3. Werktag des Monats fällig.",
    )
    lindenweg = (
        "chunk-lindenweg",
        "Mietvertrag Lindenweg 12\nDie monatliche Kaltmiete beträgt 945,00 EUR.",
    )
    result = extractive_answer_from_passages(
        "Wie hoch ist die Miete im Mietvertrag Lindenweg?",
        [generic, lindenweg],
    )
    assert result is not None
    assert result.passage_id == "chunk-lindenweg"
    assert "945" in result.answer
