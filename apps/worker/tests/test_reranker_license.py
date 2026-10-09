from docuvate_worker.infrastructure.chat.rag_rerank import (
    DEFAULT_RERANKER_MODEL,
    PERMISSIVE_RERANKER_MODELS,
    RERANKER_MODEL,
)

# SPDX identifiers recorded in-repo (Hugging Face model cards).
PERMISSIVE_RERANKER_LICENSES = {
    "BAAI/bge-reranker-v2-m3": "apache-2.0",
    "BAAI/bge-reranker-base": "mit",
    "Xenova/ms-marco-MiniLM-L-6-v2": "apache-2.0",
    "Xenova/ms-marco-MiniLM-L-12-v2": "apache-2.0",
}


def test_default_reranker_is_permissively_licensed() -> None:
    assert DEFAULT_RERANKER_MODEL in PERMISSIVE_RERANKER_MODELS
    assert RERANKER_MODEL == DEFAULT_RERANKER_MODEL or RERANKER_MODEL in PERMISSIVE_RERANKER_MODELS


def test_allowlisted_rerankers_have_recorded_permissive_license() -> None:
    for model in PERMISSIVE_RERANKER_MODELS:
        license_id = PERMISSIVE_RERANKER_LICENSES.get(model)
        assert license_id in {"apache-2.0", "mit"}, model
