#!/usr/bin/env python3
"""Write distinct layout-workspace PDF fixtures (landscape, scan+OCR, multipage headings)."""
from __future__ import annotations

import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
WORKER = REPO / "apps" / "worker"
sys.path.insert(0, str(WORKER / "src"))
sys.path.insert(0, str(WORKER))

from tests.synthetic_layout_pdfs import (  # noqa: E402
    _merge_two_pages,
    _single_page_pdf,
    layout_regression_payroll_pdf,
)
from tests.synthetic_scan_pdfs import scanned_with_invisible_ocr_text_layer_pdf  # noqa: E402

OUT = Path(__file__).resolve().parent / "fixtures"
OUT.mkdir(parents=True, exist_ok=True)


def brutto_field_pdf() -> bytes:
    stream = "\n".join(
        [
            "BT /F2 13 Tf 40 720 Td (Rechnung Layout-Workspace Demo) Tj ET",
            "BT /F1 10 Tf 40 680 Td (Bruttobetrag:) Tj ET",
            "BT /F1 10 Tf 200 680 Td (12.500,00 EUR) Tj ET",
            "BT /F1 9 Tf 40 640 Td (Kurzer Absender: Demo Nord GmbH) Tj ET",
        ]
    )
    mb = "[0 0 595 842]"
    stream_b = stream.encode("latin-1")
    objects = [
        b"1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n",
        b"2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n",
        (
            f"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox {mb} "
            f"/Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>endobj\n"
        ).encode("latin-1"),
        bytes(f"4 0 obj<< /Length {len(stream_b)} >>stream\n", "latin-1") + stream_b + b"\nendstream\nendobj\n",
        b"5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n",
        b"6 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>endobj\n",
    ]
    body = b"%PDF-1.4\n" + b"".join(objects)
    xref_start = len(body)
    xref_lines = [b"xref\n0 7\n0000000000 65535 f \n"]
    offset = len(b"%PDF-1.4\n")
    for obj in objects:
        xref_lines.append(f"{offset:010d} 00000 n \n".encode("latin-1"))
        offset += len(obj)
    trailer = f"trailer<< /Size 7 /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF\n".encode("latin-1")
    return body + b"".join(xref_lines) + trailer


def landscape_fixture_pdf() -> bytes:
    stream = "\n".join(
        [
            "BT /F2 14 Tf 48 520 Td (QUERFORMAT-FIXTURE 842x595) Tj ET",
            "BT /F1 11 Tf 48 480 Td (Landscape-only content row A) Tj ET",
            "BT /F1 11 Tf 420 480 Td (Landscape-only content row B) Tj ET",
            "0.5 450 m 780 450 l S",
            "0.5 430 m 780 430 l S",
        ]
    )
    return _single_page_pdf(stream, media=(842.0, 595.0))


def many_page_strip_pdf(page_count: int = 55) -> bytes:
    import io

    from pypdf import PdfReader, PdfWriter

    writer = PdfWriter()
    for index in range(page_count):
        label = index + 1
        stream = f"BT /F1 10 Tf 40 700 Td (Layout strip Seite {label}) Tj ET"
        page = _single_page_pdf(stream)
        reader = PdfReader(io.BytesIO(page))
        writer.append_pages_from_reader(reader)
    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()


def multipage_outline_pdf() -> bytes:
    page1 = _single_page_pdf(
        "\n".join(
            [
                "BT /F2 13 Tf 40 700 Td (Vertragsuebersicht) Tj ET",
                "BT /F1 10 Tf 40 660 Td (Kapitel Eins: Leistungsumfang) Tj ET",
            ]
        )
    )
    page2 = _single_page_pdf(
        "\n".join(
            [
                "BT /F2 13 Tf 40 700 Td (Anhang Preisliste) Tj ET",
                "BT /F1 10 Tf 40 660 Td (Seite zwei mit Gliederungssprung.) Tj ET",
            ]
        )
    )
    return _merge_two_pages(page1, page2)


def main() -> None:
    (OUT / "layout-ws-brutto.pdf").write_bytes(brutto_field_pdf())
    (OUT / "layout-ws-landscape.pdf").write_bytes(landscape_fixture_pdf())
    (OUT / "layout-ws-scanned.pdf").write_bytes(scanned_with_invisible_ocr_text_layer_pdf())
    (OUT / "layout-ws-multipage.pdf").write_bytes(multipage_outline_pdf())
    (OUT / "layout-ws-many-pages.pdf").write_bytes(many_page_strip_pdf(55))
    (OUT / "layout-ws-compare-unreliable.pdf").write_bytes(layout_regression_payroll_pdf())
    print("Wrote fixtures to", OUT)


if __name__ == "__main__":
    main()
