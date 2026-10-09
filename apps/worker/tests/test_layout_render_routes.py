from fastapi.testclient import TestClient

from docuvate_worker.main import app

client = TestClient(app)
SECRET = "worker-shared-secret"


def _headers() -> dict[str, str]:
    return {"X-Worker-Secret": SECRET, "Content-Type": "application/json"}


def test_render_html_rejects_malformed_ir() -> None:
    response = client.post(
        "/v1/layout/render-html",
        headers=_headers(),
        json={"layoutIr": {"version": 1, "pages": [{"page": 1}]}},
    )
    assert response.status_code == 422


def test_render_typst_rejects_too_many_blocks() -> None:
    blocks = [{"page": 1, "x": 0.1, "y": 0.1, "width": 0.1, "height": 0.02, "text": "x"}]
    pages = [{"page": 1, "widthPt": 595, "heightPt": 842, "blocks": blocks * 10_001}]
    response = client.post(
        "/v1/layout/render-typst",
        headers=_headers(),
        json={"layoutIr": {"version": 1, "pages": pages}},
    )
    assert response.status_code == 422
