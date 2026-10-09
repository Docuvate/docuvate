import logging

from docuvate_worker.domain.models import ExtractionResult
from docuvate_worker.infrastructure.extractors.engine_catalog import engine_by_name
from docuvate_worker.infrastructure.extractors.markdown import extraction_to_markdown
from docuvate_worker.infrastructure.extractors.registry import ExtractorRegistry
from docuvate_worker.infrastructure.layout.build import build_layout_ir

logger = logging.getLogger(__name__)

_registry = ExtractorRegistry()


def _with_markdown(result: ExtractionResult) -> ExtractionResult:
    if result.markdown and result.markdown.strip():
        return result
    markdown = extraction_to_markdown(result.text, result.blocks)
    if markdown is None:
        return result
    return ExtractionResult(
        text=result.text,
        fields=result.fields,
        blocks=result.blocks,
        markdown=markdown,
    )


def _with_layout_ir(
    result: ExtractionResult, content: bytes, mime_type: str
) -> ExtractionResult:
    if result.layout_ir:
        return result
    try:
        layout = build_layout_ir(content, mime_type, result.blocks)
    except Exception as exc:
        logger.warning(
            "layout_ir_build_failed type=%s",
            type(exc).__name__,
            exc_info=exc,
        )
        return result
    if layout is None:
        return result
    return ExtractionResult(
        text=result.text,
        fields=result.fields,
        blocks=result.blocks,
        markdown=result.markdown,
        layout_ir=layout.to_json(),
    )


def extract_document(
    content: bytes, mime_type: str, engine: str | None = None
) -> ExtractionResult:
    if engine:
        resolved = engine_by_name(engine)
    else:
        resolved = _registry.resolve(mime_type)
    base = _with_markdown(resolved.extract(content, mime_type))
    return _with_layout_ir(base, content, mime_type)


def compare_engines(
    content: bytes,
    mime_type: str,
    engines: list[str],
    *,
    max_pages: int | None = None,
):
    from docuvate_worker.infrastructure.extractors.compare import run_compare

    return run_compare(content, mime_type, engines, max_pages=max_pages)
