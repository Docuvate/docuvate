from abc import ABC, abstractmethod

from docuvate_worker.domain.models import ExtractionResult


class ExtractorEngine(ABC):
    name: str

    @abstractmethod
    def supports(self, mime_type: str) -> bool:
        pass

    @abstractmethod
    def extract(self, content: bytes, mime_type: str) -> ExtractionResult:
        pass
