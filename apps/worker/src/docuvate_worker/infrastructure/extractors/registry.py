import os

from docuvate_worker.domain.ports import ExtractorEngine
from docuvate_worker.infrastructure.extractors.engine_catalog import engine_by_name


def _engine_name() -> str:
    return os.environ.get("EXTRACTOR_ENGINE", "pipeline").strip().lower()


def build_extractor() -> ExtractorEngine:
    return engine_by_name(_engine_name())


class ExtractorRegistry:
    def __init__(self) -> None:
        self._engine = build_extractor()

    @property
    def active_engine(self) -> str:
        return self._engine.name

    def resolve(self, mime_type: str) -> ExtractorEngine:
        if self._engine.supports(mime_type):
            return self._engine
        return self._engine
