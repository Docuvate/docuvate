import logging

from docuvate_worker.domain.models import ExtractionResult
from docuvate_worker.domain.ports import ExtractorEngine
from docuvate_worker.infrastructure.extractors.heuristic_fields import heuristic_fields
from docuvate_worker.infrastructure.extractors.paddle_engine import ocr_image_bytes, ocr_pdf_bytes
from docuvate_worker.infrastructure.extractors.pdf_native import try_extract_pdf_native

logger = logging.getLogger(__name__)


class PipelineExtractor(ExtractorEngine):
    """Born-digital PDF text first, then PaddleOCR for scans/images."""

    name = "pipeline"

    def supports(self, mime_type: str) -> bool:
        return mime_type.startswith("image/") or mime_type == "application/pdf"

    def extract(self, content: bytes, mime_type: str) -> ExtractionResult:
        if mime_type == "application/pdf":
            native = try_extract_pdf_native(content)
            if native is not None:
                text, blocks = native
                logger.info("PDF native text path (%d chars, %d blocks)", len(text), len(blocks))
                return ExtractionResult(
                    text=text,
                    fields=heuristic_fields(text),
                    blocks=blocks or None,
                )
            logger.info("PDF has little/no text layer — falling back to PaddleOCR.")
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
