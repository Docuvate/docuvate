# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Runtime probes for which extractors are installed and runnable in this worker."""

from __future__ import annotations

import importlib.util
import logging

logger = logging.getLogger(__name__)

_availability_cache: dict[str, bool] | None = None


def _module_installed(name: str) -> bool:
    """True when ``name`` is importable, without importing it.

    The probes run in the long-lived API parent process. Importing paddle, cv2 or
    docling there maps hundreds of MiB of native code and heap into the parent for
    the rest of its life, which starves the cgroup budget that extract admission
    reserves for the pool child. ``find_spec`` only resolves the package location.
    """
    try:
        return importlib.util.find_spec(name) is not None
    except (ImportError, ValueError) as exc:
        logger.debug("module %s unavailable: %s", name, exc)
        return False


def _probe_paddle() -> bool:
    return _module_installed("cv2") and _module_installed("paddleocr")


def _probe_tesseract() -> bool:
    return _module_installed("pytesseract")


def _probe_docling() -> bool:
    return _module_installed("docling")


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
    global _availability_cache  # noqa: PLW0603
    if _availability_cache is None:
        from docuvate_worker.infrastructure.extractors.engine_catalog import (  # noqa: PLC0415
            ENGINE_CATALOG,
        )

        _availability_cache = {m.id: probe_engine_available(m.id) for m in ENGINE_CATALOG}
    return dict(_availability_cache)


def clear_availability_cache() -> None:
    global _availability_cache  # noqa: PLW0603
    _availability_cache = None
