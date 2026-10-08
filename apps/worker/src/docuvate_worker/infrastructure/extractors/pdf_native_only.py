from docuvate_worker.domain.models import ExtractionResult
from docuvate_worker.domain.ports import ExtractorEngine
from docuvate_worker.infrastructure.extractors.heuristic_fields import heuristic_fields
from docuvate_worker.infrastructure.extractors.pdf_native import try_extract_pdf_native


class PdfNativeOnlyExtractor(ExtractorEngine):
    name = "pdf_native"

    def supports(self, mime_type: str) -> bool:
        return mime_type == "application/pdf"

    def extract(self, content: bytes, mime_type: str) -> ExtractionResult:
        if mime_type != "application/pdf":
            return ExtractionResult(text="", fields=[], blocks=None)

        native = try_extract_pdf_native(content)
        if native is None:
            return ExtractionResult(text="", fields=[], blocks=None)

        text, blocks = native
        return ExtractionResult(
            text=text,
            fields=heuristic_fields(text),
            blocks=blocks or None,
        )
