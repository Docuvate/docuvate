from unittest.mock import patch

from fastapi.testclient import TestClient

from docuvate_worker.infrastructure.chat.rag_rerank import RagPassage, RagRetrieveResult
from docuvate_worker.main import app

client = TestClient(app)
SECRET = "worker-shared-secret"


def test_rag_retrieve_requires_secret() -> None:
    response = client.post("/v1/rag/retrieve", json={"query": "test", "passages": []})
    assert response.status_code == 401


def test_rag_retrieve_ranks_passages() -> None:
    fake_ranked = [
        RagRetrieveResult(id="a", score=0.95),
        RagRetrieveResult(id="b", score=0.01),
    ]
    with patch(
        "docuvate_worker.presentation.routes.rerank_passages",
        return_value=(fake_ranked, True),
    ):
        response = client.post(
            "/v1/rag/retrieve",
            headers={"X-Worker-Secret": SECRET},
            json={
                "query": "Gesamtsumme Rechnung",
                "passages": [
                    {"id": "a", "text": "Rechnung Nordwind: Gesamtsumme 100 EUR"},
                    {"id": "b", "text": "Wetterbericht für morgen"},
                ],
            },
        )
    assert response.status_code == 200
    data = response.json()
    assert data["results"][0]["id"] == "a"
    assert data["reranker_used"] is True


def test_rag_retrieve_empty_when_reranker_unavailable() -> None:
    with patch(
        "docuvate_worker.presentation.routes.rerank_passages",
        return_value=([], False),
    ):
        response = client.post(
            "/v1/rag/retrieve",
            headers={"X-Worker-Secret": SECRET},
            json={
                "query": "test",
                "passages": [{"id": "a", "text": "x"}],
            },
        )
    data = response.json()
    assert data["results"] == []
    assert data["reranker_used"] is False
