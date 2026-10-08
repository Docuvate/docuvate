"""Runtime probes for which extractors are installed and runnable in this worker."""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

_availability_cache: dict[str, bool] | None = None


def _probe_paddle() -> bool:
    try:
        import cv2  # noqa: F401
        import paddleocr  # noqa: F401

        return True
    except Exception as exc:
        logger.debug("PaddleOCR unavailable: %s", exc)
        return False


def _probe_tesseract() -> bool:
    try:
        import pytesseract  # noqa: F401

        return True
    except Exception:
        return False


def _probe_docling() -> bool:
    try:
        import docling  # noqa: F401

        return True
    except Exception:
        return False


def probe_engine_available(engine_id: str) -> bool:
    key = engine_id.strip().lower()
    if key in ("pipeline", "pdf_native", "native", "pdfplumber", "default"):
        return True
    if key in ("paddle", "paddleocr"):
        return _probe_paddle()
    if key == "tesseract":
        return _probe_tesseract()
    if key == "docling":
        return _probe_docling()
    return False


def availability_by_id() -> dict[str, bool]:
    global _availability_cache
    if _availability_cache is None:
        from docuvate_worker.infrastructure.extractors.engine_catalog import ENGINE_CATALOG

        _availability_cache = {m.id: probe_engine_available(m.id) for m in ENGINE_CATALOG}
    return dict(_availability_cache)


def clear_availability_cache() -> None:
    global _availability_cache
    _availability_cache = None
