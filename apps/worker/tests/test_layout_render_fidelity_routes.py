"""Worker layout render routes expose reconstruction reliability."""

from fastapi.testclient import TestClient

from docuvate_worker.main import app

client = TestClient(app)
SECRET = "worker-shared-secret"


def _headers() -> dict[str, str]:
    return {"X-Worker-Secret": SECRET, "Content-Type": "application/json"}


def test_render_typst_marks_arabic_unreliable() -> None:
    from docuvate_worker.infrastructure.layout.extract import extract_layout_pdf_bytes
    from tests.synthetic_layout_fpdf import arabic_rtl_pdf

    pdf = arabic_rtl_pdf()
    doc = extract_layout_pdf_bytes(pdf)
    assert doc is not None
    response = client.post(
        "/v1/layout/render-typst",
        headers=_headers(),
        json={
            "layoutIr": doc.to_json(),
            "originalPdfBase64": __import__("base64").b64encode(pdf).decode("ascii"),
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["reconstructionReliable"] is False
    assert body["unreliableReason"] == "unsupported_script"
    assert body["typst"]
