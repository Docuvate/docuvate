from fastapi.testclient import TestClient

from docuvate_worker.main import app

client = TestClient(app)
SECRET = "worker-shared-secret"


def _headers() -> dict[str, str]:
    return {"X-Worker-Secret": SECRET, "Content-Type": "application/json"}


def _base_page(**block_overrides: object) -> dict:
    block = {
        "page": 1,
        "x": 0.1,
        "y": 0.1,
        "width": 0.2,
        "height": 0.02,
        "text": "hi",
        **block_overrides,
    }
    return {
        "version": 1,
        "pages": [
            {
                "page": 1,
                "widthPt": 595,
                "heightPt": 842,
                "blocks": [block],
            }
        ],
    }


def test_render_html_rejects_injected_block_index() -> None:
    payload = _base_page(blockIndex='1" onmouseover="alert(1)')
    response = client.post("/v1/layout/render-html", headers=_headers(), json={"layoutIr": payload})
    assert response.status_code == 422


def test_render_typst_rejects_string_rotation() -> None:
    payload = _base_page()
    payload["pages"][0]["widgets"] = [
        {
            "kind": "text",
            "page": 1,
            "x": 0.1,
            "y": 0.2,
            "width": 0.3,
            "height": 0.05,
            "value": "x",
            "rotationDeg": '#read("/etc/passwd")',
        }
    ]
    response = client.post("/v1/layout/render-typst", headers=_headers(), json={"layoutIr": payload})
    assert response.status_code == 422


def test_render_html_rejects_string_font_size() -> None:
    payload = _base_page(fontSizePt="12")
    response = client.post("/v1/layout/render-html", headers=_headers(), json={"layoutIr": payload})
    assert response.status_code == 422


def test_render_html_rejects_short_text_rgb() -> None:
    payload = _base_page(textRgb=[1, 2])
    response = client.post("/v1/layout/render-html", headers=_headers(), json={"layoutIr": payload})
    assert response.status_code == 422


def test_render_html_escapes_valid_block_index() -> None:
    payload = _base_page(blockIndex=3)
    response = client.post("/v1/layout/render-html", headers=_headers(), json={"layoutIr": payload})
    assert response.status_code == 200
    assert 'data-block-index="3"' in response.json()["html"]


def test_render_html_rejects_excess_vectors() -> None:
    vectors = [
        {
            "kind": "rect",
            "x": 0.01,
            "y": 0.01,
            "width": 0.001,
            "height": 0.001,
        }
        for _ in range(5001)
    ]
    payload = _base_page()
    payload["pages"][0]["vectors"] = vectors
    response = client.post("/v1/layout/render-html", headers=_headers(), json={"layoutIr": payload})
    assert response.status_code == 422
