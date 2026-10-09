"""Generate synthetic PDF bytes at test time (no checked-in fixtures)."""

from __future__ import annotations

import io

_BORN_DIGITAL_BANNER = (
    "Synthetic layout regression document with enough words to classify as born digital."
)


def _single_page_pdf(stream: str, media: tuple[float, float] = (612.0, 792.0)) -> bytes:
    w, h = media
    stream_b = stream.encode("latin-1")
    mb = f"[0 0 {w:.0f} {h:.0f}]"
    objects = [
        b"1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n",
        b"2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n",
        (
            f"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox {mb} "
            f"/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj\n"
        ).encode("latin-1"),
        bytes(f"4 0 obj<< /Length {len(stream_b)} >>stream\n", "latin-1") + stream_b + b"\nendstream\nendobj\n",
        b"5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n",
    ]
    body = b"%PDF-1.4\n" + b"".join(objects)
    xref_start = len(body)
    xref_lines = [b"xref\n0 6\n0000000000 65535 f \n"]
    offset = len(b"%PDF-1.4\n")
    for obj in objects:
        xref_lines.append(f"{offset:010d} 00000 n \n".encode("latin-1"))
        offset += len(obj)
    trailer = (
        f"trailer<< /Size 6 /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF\n".encode("latin-1")
    )
    return body + b"".join(xref_lines) + trailer


def _banner_stream() -> str:
    return f"BT /F1 9 Tf 36 760 Td ({_BORN_DIGITAL_BANNER}) Tj ET"


def layout_regression_payroll_pdf() -> bytes:
    """Single-page grid form: long bold title, table lines, label/value pairs (synthetic)."""
    title = (
        "Synthetic electronic payroll certificate for tax year 2025 "
        "(fictional employer, no personal data)"
    )
    w, h = 612.0, 792.0
    lines = [
        _banner_stream(),
        f"BT /F2 13 Tf 40 720 Td ({title}) Tj ET",
        "0.5 680 m 520 680 l S",
        "0.5 660 m 520 660 l S",
        "0.5 640 m 520 640 l S",
        "0.5 620 m 520 620 l S",
        "0.5 600 m 520 600 l S",
        "0.5 580 m 520 580 l S",
        "120 680 m 120 580 l S",
        "280 680 m 280 580 l S",
        "400 680 m 400 580 l S",
        "520 680 m 520 580 l S",
        "BT /F1 8 Tf 48 668 Td (1.) Tj ET",
        "BT /F1 8 Tf 130 668 Td (Reporting period) Tj ET",
        "BT /F1 8 Tf 410 668 Td (01.01. - 31.12.) Tj ET",
        "BT /F1 8 Tf 48 648 Td (3.) Tj ET",
        "BT /F1 8 Tf 130 648 Td (Gross wages incl. benefits) Tj ET",
        "BT /F1 8 Tf 410 648 Td (48.250,00) Tj ET",
        "BT /F1 8 Tf 48 628 Td (5.) Tj ET",
        "BT /F1 8 Tf 130 628 Td (Income tax withheld) Tj ET",
        "BT /F1 8 Tf 410 628 Td (9.120,00) Tj ET",
        "BT /F1 9 Tf 40 540 Td (Employee ID:) Tj ET",
        "BT /F1 9 Tf 200 540 Td (SYN-4711) Tj ET",
    ]
    stream = "\n".join(lines)
    stream_b = stream.encode("latin-1")
    mb = f"[0 0 {w:.0f} {h:.0f}]"
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
    trailer = (
        f"trailer<< /Size 7 /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF\n".encode("latin-1")
    )
    return body + b"".join(xref_lines) + trailer


def delivery_note_table_pdf() -> bytes:
    stream = "\n".join(
        [
            _banner_stream(),
            "0.5 700 m 400 700 l S",
            "0.5 680 m 400 680 l S",
            "0.5 660 m 400 660 l S",
            "0.5 640 m 400 640 l S",
            "100 700 m 100 640 l S",
            "200 700 m 200 640 l S",
            "300 700 m 300 640 l S",
            "400 700 m 400 640 l S",
            "BT /F1 10 Tf 12 688 Td (Item) Tj ET",
            "BT /F1 10 Tf 112 688 Td (Qty) Tj ET",
            "BT /F1 10 Tf 12 668 Td (Widget A) Tj ET",
            "BT /F1 10 Tf 112 668 Td (2) Tj ET",
            "BT /F1 10 Tf 12 648 Td (Widget B) Tj ET",
            "BT /F1 10 Tf 112 648 Td (1) Tj ET",
        ]
    )
    return _single_page_pdf(stream)


def delivery_note_multipage_pdf() -> bytes:
    """Two-page delivery note for page-link UI screenshots."""
    page1 = delivery_note_table_pdf()
    page2_stream = "\n".join(
        [
            _banner_stream(),
            "BT /F1 11 Tf 40 700 Td (Page two continues the synthetic delivery note.) Tj ET",
            "BT /F1 10 Tf 40 660 Td (Footer line on page two.) Tj ET",
        ]
    )
    page2 = _single_page_pdf(page2_stream)
    return _merge_two_pages(page1, page2)


def two_column_words_pdf() -> bytes:
    stream = "\n".join(
        [
            _banner_stream(),
            "BT /F1 10 Tf 40 700 Td (LeftA) Tj ET",
            "BT /F1 10 Tf 40 680 Td (LeftB) Tj ET",
            "BT /F1 10 Tf 350 700 Td (RightA) Tj ET",
            "BT /F1 10 Tf 350 680 Td (RightB) Tj ET",
        ]
    )
    return _single_page_pdf(stream)


def form_disclosure_pdf() -> bytes:
    stream = "\n".join(
        [
            _banner_stream(),
            "BT /F1 10 Tf 60 700 Td (Label:) Tj ET",
            "BT /F1 10 Tf 220 700 Td (Value text) Tj ET",
        ]
    )
    return _single_page_pdf(stream)


def form_disclosure_acroform_pdf() -> bytes:
    """Born-digital form with AcroForm text field and checked checkbox."""
    from pypdf import PdfReader, PdfWriter
    from pypdf.generic import (
        ArrayObject,
        BooleanObject,
        DictionaryObject,
        NameObject,
        NumberObject,
        TextStringObject,
    )

    base = _single_page_pdf(
        "\n".join(
            [
                _banner_stream(),
                "BT /F1 10 Tf 60 700 Td (Disclosure field:) Tj ET",
            ]
        )
    )
    reader = PdfReader(io.BytesIO(base))
    writer = PdfWriter()
    writer.append_pages_from_reader(reader)
    page_ref = writer.pages[0]

    text_field = DictionaryObject(
        {
            NameObject("/FT"): NameObject("/Tx"),
            NameObject("/T"): TextStringObject("disclosure"),
            NameObject("/V"): TextStringObject("Value text"),
            NameObject("/Rect"): ArrayObject(
                [NumberObject(220), NumberObject(688), NumberObject(400), NumberObject(712)]
            ),
            NameObject("/Subtype"): NameObject("/Widget"),
            NameObject("/Type"): NameObject("/Annot"),
            NameObject("/P"): page_ref.indirect_reference,
        }
    )
    check_field = DictionaryObject(
        {
            NameObject("/FT"): NameObject("/Btn"),
            NameObject("/T"): TextStringObject("agree"),
            NameObject("/V"): NameObject("/Yes"),
            NameObject("/AS"): NameObject("/Yes"),
            NameObject("/Rect"): ArrayObject(
                [NumberObject(60), NumberObject(640), NumberObject(76), NumberObject(656)]
            ),
            NameObject("/Subtype"): NameObject("/Widget"),
            NameObject("/Type"): NameObject("/Annot"),
            NameObject("/P"): page_ref.indirect_reference,
            NameObject("/MK"): DictionaryObject({NameObject("/CA"): TextStringObject("8")}),
        }
    )
    page_ref[NameObject("/Annots")] = ArrayObject(
        [writer._add_object(text_field), writer._add_object(check_field)]
    )
    acroform = DictionaryObject(
        {
            NameObject("/Fields"): ArrayObject(
                [text_field.indirect_reference, check_field.indirect_reference]
            ),
            NameObject("/NeedAppearances"): BooleanObject(True),
        }
    )
    writer._root_object[NameObject("/AcroForm")] = writer._add_object(acroform)

    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()


def rotated_mediabox_pdf() -> bytes:
    """Portrait MediaBox with /Rotate 90; pdfplumber reports 842×595."""
    from pypdf import PdfReader, PdfWriter

    base = _single_page_pdf(_banner_stream(), media=(595.0, 842.0))
    reader = PdfReader(io.BytesIO(base))
    writer = PdfWriter()
    page = reader.pages[0]
    page.rotate(90)
    writer.add_page(page)
    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()


def rotated_heading_pdf() -> bytes:
    stream = "\n".join(
        [
            _banner_stream(),
            "q 0.707 -0.707 0.707 0.707 120 600 cm BT /F1 12 Tf 0 0 Td (Rotated) Tj ET Q",
        ]
    )
    return _single_page_pdf(stream)


def mixed_page_sizes_pdf() -> bytes:
    portrait = _single_page_pdf(_banner_stream(), media=(595.0, 842.0))
    landscape = _single_page_pdf(_banner_stream(), media=(842.0, 595.0))
    return _merge_two_pages(portrait, landscape)


def _merge_two_pages(page1: bytes, page2: bytes) -> bytes:
    from pypdf import PdfReader, PdfWriter

    writer = PdfWriter()
    for blob in (page1, page2):
        reader = PdfReader(io.BytesIO(blob))
        writer.append_pages_from_reader(reader)
    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()
