import pytest

from docuvate_worker.infrastructure.chat.rag_rerank import (
    RagPassage,
    ensure_reranker_loaded,
    rerank_passages,
    sigmoid_score,
)


def test_sigmoid_maps_logits_to_unit_interval() -> None:
    assert sigmoid_score(0.0) == 0.5
    assert sigmoid_score(5.0) > 0.99
    assert sigmoid_score(-5.0) < 0.01


def test_reranker_prefers_relevant_passage() -> None:
    import os

    if os.environ.get("RUN_RERANKER_INTEGRATION") != "1":
        pytest.skip("set RUN_RERANKER_INTEGRATION=1 to run ONNX reranker integration test")
    if not ensure_reranker_loaded():
        pytest.skip("reranker model unavailable in this environment")
    ranked, used = rerank_passages(
        "Gesamtsumme Rechnung",
        [
            RagPassage(id="a", text="Rechnung Nordwind: Gesamtsumme 1.234,56 EUR"),
            RagPassage(id="b", text="Wetterbericht für morgen"),
        ],
        top_k=2,
    )
    assert used is True
    assert ranked[0].id == "a"
    assert ranked[0].score > 0.5
    assert ranked[1].score < 0.1
