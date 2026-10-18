"""Typst export mode on worker render-typst route."""

from fastapi.testclient import TestClient

from docuvate_worker.main import app
from docuvate_worker.infrastructure.layout.extract import extract_layout_pdf_bytes
from tests.synthetic_layout_pdfs import form_disclosure_pdf

client = TestClient(app)
SECRET = "worker-shared-secret"


def _headers() -> dict[str, str]:
    return {"X-Worker-Secret": SECRET, "Content-Type": "application/json"}


def test_render_typst_semantisch_mode() -> None:
    pdf = form_disclosure_pdf()
    doc = extract_layout_pdf_bytes(pdf)
    assert doc is not None
    response = client.post(
        "/v1/layout/render-typst",
        headers=_headers(),
        json={"layoutIr": doc.to_json(), "mode": "semantisch"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "Docuvate Export (semantisch)" in body["typst"]
    assert "#place(" not in body["typst"]


def test_render_typst_exakt_mode_default() -> None:
    pdf = form_disclosure_pdf()
    doc = extract_layout_pdf_bytes(pdf)
    assert doc is not None
    response = client.post(
        "/v1/layout/render-typst",
        headers=_headers(),
        json={"layoutIr": doc.to_json()},
    )
    assert response.status_code == 200
    assert "#place(" in response.json()["typst"]
