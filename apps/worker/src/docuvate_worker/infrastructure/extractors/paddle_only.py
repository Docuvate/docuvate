from docuvate_worker.domain.models import ExtractionResult
from docuvate_worker.domain.ports import ExtractorEngine
from docuvate_worker.infrastructure.extractors.heuristic_fields import heuristic_fields
from docuvate_worker.infrastructure.extractors.paddle_engine import ocr_image_bytes, ocr_pdf_bytes


class PaddleOnlyExtractor(ExtractorEngine):
    """Force PaddleOCR (skip born-digital PDF text layer)."""

    name = "paddle"

    def supports(self, mime_type: str) -> bool:
        return mime_type.startswith("image/") or mime_type == "application/pdf"

    def extract(self, content: bytes, mime_type: str) -> ExtractionResult:
        if mime_type == "application/pdf":
            text, blocks = ocr_pdf_bytes(content)
        elif mime_type.startswith("image/"):
            text, blocks = ocr_image_bytes(content)
        else:
            text, blocks = "", []

        return ExtractionResult(
            text=text.strip(),
            fields=heuristic_fields(text),
            blocks=blocks or None,
        )
