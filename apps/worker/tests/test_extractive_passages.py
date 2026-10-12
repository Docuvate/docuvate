from docuvate_worker.infrastructure.chat.context_qa import extractive_answer_from_passages


def test_extractive_answer_from_passages_picks_sentence() -> None:
    pid = "chunk-1"
    text = "Einleitung. Die Miete ist bis zum 3. Werktag fällig."
    result = extractive_answer_from_passages("Wann ist die Miete fällig?", [(pid, text)])
    assert result is not None
    assert result.passage_id == pid
    assert "3. Werktag" in result.answer
