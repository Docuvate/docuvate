from fastapi.testclient import TestClient

from docuvate_worker.main import app

client = TestClient(app)
SECRET = "worker-shared-secret"


def test_embed_accepts_query_input_type() -> None:
    response = client.post(
        "/v1/embed",
        headers={"X-Worker-Secret": SECRET},
        json={"texts": ["Miete fällig"], "input_type": "query"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["embeddings"]) == 1
    assert len(payload["embeddings"][0]) > 0
