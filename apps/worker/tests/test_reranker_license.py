from docuvate_worker.infrastructure.chat.rag_rerank import (
    DEFAULT_RERANKER_MODEL,
    PERMISSIVE_RERANKER_MODELS,
    RERANKER_MODEL,
)


def test_default_reranker_is_permissively_licensed() -> None:
    assert DEFAULT_RERANKER_MODEL in PERMISSIVE_RERANKER_MODELS
    assert RERANKER_MODEL == DEFAULT_RERANKER_MODEL or RERANKER_MODEL in PERMISSIVE_RERANKER_MODELS
