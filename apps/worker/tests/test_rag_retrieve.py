from fastapi.testclient import TestClient

from docuvate_worker.main import app

client = TestClient(app)
SECRET = "worker-shared-secret"


def test_rag_retrieve_requires_secret() -> None:
    response = client.post("/v1/rag/retrieve", json={"query": "test", "passages": []})
    assert response.status_code == 401


def test_rag_retrieve_ranks_passages() -> None:
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
