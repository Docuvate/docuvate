"""Synthetic scanned PDFs: rasterized text + invisible OCR text layer."""

from __future__ import annotations

import io
import random
from collections.abc import Iterable

from PIL import Image, ImageDraw, ImageFont

from tests.synthetic_layout_pdfs import _BORN_DIGITAL_BANNER


def _pdf_escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _dejavu_font(size_px: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    try:
        return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", size=size_px)
    except OSError:
        return ImageFont.load_default()


def _build_scan_pdf(
    lines: Iterable[tuple[str, float, float, int]],
    *,
    media: tuple[float, float] = (612.0, 792.0),
    rotate: int = 0,
    include_text_layer: bool = True,
    dpi: int = 120,
) -> bytes:
    w_pt, h_pt = media
    w_px = int(w_pt * dpi / 72)
    h_px = int(h_pt * dpi / 72)
    rng = random.Random(42)
    img = Image.new("RGB", (w_px, h_px), color=(248, 245, 238))
    draw = ImageDraw.Draw(img)
    line_list = list(lines)
    for text, x_pt, y_pt, size_pt in line_list:
        x_px = int(x_pt * dpi / 72)
        y_px = int((h_pt - y_pt) * dpi / 72)
        f = _dejavu_font(max(8, int(size_pt * dpi / 72)))
        draw.text(
            (x_px + rng.randint(-2, 2), y_px + rng.randint(-2, 2)),
            text,
            fill=(25, 25, 28),
            font=f,
        )
    for _ in range(500):
        draw.point(
            (rng.randint(0, w_px - 1), rng.randint(0, h_px - 1)),
            fill=(rng.randint(200, 235),) * 3,
        )
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=82)
    jpeg = buf.getvalue()

    content_parts: list[str] = [
        "q",
        f"{w_pt:.2f} 0 0 {h_pt:.2f} 0 0 cm",
        "/Im1 Do",
        "Q",
    ]
    if include_text_layer:
        content_parts.append(
            f"BT /F1 9 Tf 3 Tr 36 760 Td ({_pdf_escape(_BORN_DIGITAL_BANNER)}) Tj 0 Tr ET"
        )
        for text, x_pt, y_pt, size_pt in line_list:
            content_parts.append(
                f"BT /F1 {size_pt} Tf 3 Tr {x_pt:.2f} {y_pt:.2f} Td "
                f"({_pdf_escape(text)}) Tj 0 Tr ET"
            )

    stream = "\n".join(content_parts)
    stream_b = stream.encode("latin-1", errors="replace")
    mb = f"[0 0 {w_pt:.0f} {h_pt:.0f}]"
    rotate_part = f"/Rotate {rotate} " if rotate else ""
    img_obj_header = (
        f"<< /Type /XObject /Subtype /Image /Width {w_px} /Height {h_px} "
        f"/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length {len(jpeg)} >>"
    )
    objects = [
        b"1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n",
        b"2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n",
        (
            f"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox {mb} {rotate_part}"
            f"/Contents 5 0 R /Resources << /Font << /F1 6 0 R >> "
            f"/XObject << /Im1 4 0 R >> >> >>endobj\n"
        ).encode("latin-1"),
        b"4 0 obj" + img_obj_header.encode("latin-1") + b" stream\n" + jpeg + b"\nendstream\nendobj\n",
        bytes(f"5 0 obj<< /Length {len(stream_b)} >>stream\n", "latin-1") + stream_b + b"\nendstream\nendobj\n",
        b"6 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n",
    ]
    body = b"%PDF-1.4\n" + b"".join(objects)
    xref_start = len(body)
    obj_count = len(objects) + 1
    xref_lines = [f"xref\n0 {obj_count}\n0000000000 65535 f \n".encode("latin-1")]
    offset = len(b"%PDF-1.4\n")
    for obj in objects:
        xref_lines.append(f"{offset:010d} 00000 n \n".encode("latin-1"))
        offset += len(obj)
    trailer = (
        f"trailer<< /Size {obj_count} /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF\n".encode("latin-1")
    )
    return body + b"".join(xref_lines) + trailer


def scanned_with_invisible_ocr_text_layer_pdf() -> bytes:
    lines = [
        ("Invoice SYN-9001", 48.0, 700.0, 11),
        ("Line item alpha", 48.0, 670.0, 10),
        ("Line item beta", 48.0, 650.0, 10),
    ]
    return _build_scan_pdf(lines, include_text_layer=True)


def scanned_image_only_pdf() -> bytes:
    lines = [
        ("Raster-only label", 48.0, 700.0, 11),
    ]
    return _build_scan_pdf(lines, include_text_layer=False)


def scanned_rotated_90_pdf() -> bytes:
    lines = [
        ("Rotated scan label", 80.0, 500.0, 11),
        ("Second OCR line on rotated page", 80.0, 470.0, 10),
    ]
    return _build_scan_pdf(lines, media=(792.0, 612.0), rotate=90, include_text_layer=True)
