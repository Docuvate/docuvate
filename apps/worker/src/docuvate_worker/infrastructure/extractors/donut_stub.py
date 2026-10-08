from docuvate_worker.domain.models import ExtractionResult
from docuvate_worker.domain.ports import ExtractorEngine


class DonutStubExtractor(ExtractorEngine):
    """Placeholder for Donut receipt model — registry hook for phase 2."""

    name = "donut-stub"

    def supports(self, _mime_type: str) -> bool:
        return False

    def extract(self, content: bytes, mime_type: str) -> ExtractionResult:
        raise NotImplementedError("Donut engine not enabled in MVP")
