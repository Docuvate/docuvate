import io
import os

from docuvate_worker.domain.models import ExtractionBlock

_DEFAULT_MIN_CHARS = 80


def pdf_native_min_chars() -> int:
    raw = os.environ.get("PDF_NATIVE_MIN_CHARS", str(_DEFAULT_MIN_CHARS))
    try:
        return max(0, int(raw))
    except ValueError:
        return _DEFAULT_MIN_CHARS


def try_extract_pdf_native(content: bytes) -> tuple[str, list[ExtractionBlock]] | None:
    """Extract text + word boxes from born-digital PDFs (no OCR)."""
    import pdfplumber

    page_texts: list[str] = []
    blocks: list[ExtractionBlock] = []
    block_index = 0

    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            page_text = (page.extract_text() or "").strip()
            page_texts.append(page.extract_text() or "")

            width = float(page.width or 0)
            height = float(page.height or 0)
            if width <= 0 or height <= 0:
                continue

            words = page.extract_words() or []
            if not words and page_text:
                blocks.append(
                    ExtractionBlock(
                        page=page_num,
                        x=0.05,
                        y=0.05,
                        width=0.9,
                        height=0.1,
                        text=page_text[:500],
                        block_index=block_index,
                    )
                )
                block_index += 1
                continue

            for word in words:
                text = (word.get("text") or "").strip()
                if not text:
                    continue
                x0 = float(word["x0"])
                x1 = float(word["x1"])
                top = float(word["top"])
                bottom = float(word["bottom"])
                blocks.append(
                    ExtractionBlock(
                        page=page_num,
                        x=x0 / width,
                        y=top / height,
                        width=max(0.0, (x1 - x0) / width),
                        height=max(0.0, (bottom - top) / height),
                        text=text,
                        block_index=block_index,
                    )
                )
                block_index += 1

    full_text = "\n\n".join(page_texts).strip()
    if len(full_text) < pdf_native_min_chars():
        return None
    return full_text, blocks
