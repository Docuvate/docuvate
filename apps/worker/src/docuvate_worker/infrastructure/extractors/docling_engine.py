import logging
import tempfile
from pathlib import Path

from docuvate_worker.domain.models import ExtractionResult
from docuvate_worker.domain.ports import ExtractorEngine
from docuvate_worker.infrastructure.extractors.heuristic_fields import heuristic_fields
from docuvate_worker.infrastructure.extractors.markdown import markdown_to_plain

logger = logging.getLogger(__name__)

_MIME_SUFFIX: dict[str, str] = {
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
    "image/tiff": ".tiff",
}


class DoclingExtractor(ExtractorEngine):
    """IBM Docling layout extraction — optional worker extra (PyTorch + models)."""

    name = "docling"

    def supports(self, mime_type: str) -> bool:
        return mime_type in _MIME_SUFFIX or mime_type.startswith("image/")

    def extract(self, content: bytes, mime_type: str) -> ExtractionResult:
        from docling.document_converter import DocumentConverter

        suffix = _MIME_SUFFIX.get(mime_type, ".bin")
        path: Path | None = None
        try:
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(content)
                path = Path(tmp.name)
            logger.info("Running Docling convert on %s (%d bytes)", suffix, len(content))
            converter = DocumentConverter()
            doc_result = converter.convert(path)
            markdown = doc_result.document.export_to_markdown().strip()
            text = markdown_to_plain(markdown)
            return ExtractionResult(
                text=text,
                fields=heuristic_fields(text),
                blocks=None,
                markdown=markdown or None,
            )
        finally:
            if path is not None:
                path.unlink(missing_ok=True)
