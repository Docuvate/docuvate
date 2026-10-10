# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import io
import time
from dataclasses import dataclass

from docuvate_worker.domain.models import ExtractionResult
from docuvate_worker.infrastructure.extractors.arena import pick_random_arena_engines
from docuvate_worker.infrastructure.extractors.engine_catalog import engine_by_name
from docuvate_worker.infrastructure.extractors.paddle_errors import map_paddle_exception


@dataclass
class CompareEngineResult:
    engine: str
    elapsed_ms: int
    result: ExtractionResult | None
    error: str | None


@dataclass
class CompareRunResult:
    engines: list[str]
    items: list[CompareEngineResult]


def _friendly_error(exc: Exception) -> str:
    msg = str(exc)
    lower = msg.lower()
    if "libgl.so" in msg or "libgl " in lower:
        return map_paddle_exception(exc)
    if (
        "batch_norm" in lower
        or "cast error" in lower
        or "op kernel context" in lower
        or "paddle-ocr konnte" in lower
    ):
        return map_paddle_exception(exc)
    if "docling" in lower and "no module" in lower:
        return (
            "Docling ist in diesem Worker nicht installiert. "
            "Optional mit Extra [docling] aktivieren (PyTorch + Modelle)."
        )
    if "poppler" in lower or "pdftoppm" in lower:
        return "PDF konnte nicht gerastert werden (Poppler fehlt im Worker)."
    if len(msg) > 320:  # noqa: PLR2004
        return "Extraktion fehlgeschlagen. Details stehen im Worker-Log."
    return msg


def _slice_pdf(content: bytes, mime_type: str, max_pages: int | None) -> bytes:
    if mime_type != "application/pdf" or not max_pages or max_pages <= 0:
        return content

    from pypdf import PdfReader, PdfWriter  # noqa: PLC0415

    reader = PdfReader(io.BytesIO(content))
    if len(reader.pages) <= max_pages:
        return content

    writer = PdfWriter()
    for page in reader.pages[:max_pages]:
        writer.add_page(page)
    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()


def run_compare(
    content: bytes,
    mime_type: str,
    engines: list[str],
    *,
    max_pages: int | None = None,
) -> CompareRunResult:
    payload = _slice_pdf(content, mime_type, max_pages)
    chosen = [e.strip().lower() for e in engines if e.strip()]
    if not chosen:
        chosen = pick_random_arena_engines(mime_type, count=2)

    rows: list[CompareEngineResult] = []
    for name in chosen:
        key = name.strip().lower()
        started = time.perf_counter()
        try:
            engine = engine_by_name(key)
            if not engine.supports(mime_type):
                rows.append(
                    CompareEngineResult(
                        engine=key,
                        elapsed_ms=0,
                        result=None,
                        error=f"Engine {key!r} unterstützt {mime_type} nicht.",
                    )
                )
                continue
            result = engine.extract(payload, mime_type)
            elapsed_ms = int((time.perf_counter() - started) * 1000)
            rows.append(
                CompareEngineResult(engine=key, elapsed_ms=elapsed_ms, result=result, error=None)
            )
        except Exception as exc:
            elapsed_ms = int((time.perf_counter() - started) * 1000)
            rows.append(
                CompareEngineResult(
                    engine=key,
                    elapsed_ms=elapsed_ms,
                    result=None,
                    error=_friendly_error(exc),
                )
            )

    return CompareRunResult(engines=chosen, items=rows)
