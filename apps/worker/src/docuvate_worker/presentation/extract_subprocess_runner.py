# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Run one extract job in a child process so heavy OCR/ONNX memory is reclaimed."""

from __future__ import annotations

import base64
import json
import logging
import os
import signal
import subprocess
import sys
import tempfile
import traceback
from typing import Any

from docuvate_worker.application.extract import extract_document
from docuvate_worker.domain.embedding_density.schemas import EmbeddingDensityStatePayload
from docuvate_worker.domain.extract_errors import (
    ExtractPermanentError,
    permanent_failure_from_subprocess,
)
from docuvate_worker.domain.models import (
    ExtractedDocumentImage,
    ExtractedField,
    ExtractionBlock,
    ExtractionResult,
)
from docuvate_worker.infrastructure.extract_memory.admission import extract_admission_slot
from docuvate_worker.infrastructure.extract_memory.retry_policy import (
    apply_memory_retry_overrides,
    memory_retry_already_applied,
)
from docuvate_worker.infrastructure.extractors.paddle_engine import release_paddle_ocr
from docuvate_worker.infrastructure.onnx_e5_encoder import release_onnx_encoder
from docuvate_worker.infrastructure.onnx_runtime_env import configure_onnx_runtime_env
from docuvate_worker.infrastructure.worker_memory_hygiene import reclaim_python_heap
from docuvate_worker.presentation.extract_subprocess_errors import (
    meaningful_stderr_tail,
    subprocess_failure_message,
)
from docuvate_worker.presentation.extract_subprocess_pool import (
    extract_pool_enabled,
    pooled_extract_child,
)

logger = logging.getLogger(__name__)


def extraction_result_from_wire(payload: dict[str, Any]) -> ExtractionResult:
    fields = [
        ExtractedField(
            key=str(row["key"]),
            value=str(row["value"]),
            confidence=row.get("confidence"),
        )
        for row in payload.get("fields") or []
    ]
    suggestions_raw = payload.get("field_suggestions")
    suggestions = None
    if suggestions_raw is not None:
        suggestions = [
            ExtractedField(
                key=str(row["key"]),
                value=str(row["value"]),
                confidence=row.get("confidence"),
            )
            for row in suggestions_raw
        ]
    blocks_raw = payload.get("blocks")
    blocks = None
    if blocks_raw is not None:
        blocks = [
            ExtractionBlock(
                page=int(row["page"]),
                x=float(row["x"]),
                y=float(row["y"]),
                width=float(row["width"]),
                height=float(row["height"]),
                text=str(row["text"]),
                block_index=row.get("block_index"),
            )
            for row in blocks_raw
        ]
    preview_b64 = payload.get("preview_pdf_base64")
    preview_pdf = base64.b64decode(preview_b64) if preview_b64 else None
    images_raw = payload.get("images")
    images = None
    if images_raw is not None:
        images = [
            ExtractedDocumentImage(
                page=int(row["page"]),
                x=float(row["x"]),
                y=float(row["y"]),
                width=float(row["width"]),
                height=float(row["height"]),
                kind=str(row["kind"]),
                caption=row.get("caption"),
                thumbnail_png=base64.b64decode(str(row["thumbnail_png_base64"])),
            )
            for row in images_raw
        ]
    return ExtractionResult(
        text=str(payload.get("text") or ""),
        fields=fields,
        field_suggestions=suggestions,
        blocks=blocks,
        markdown=payload.get("markdown"),
        layout_ir=payload.get("layout_ir"),
        layout_reconstruction_reliable=payload.get("layout_reconstruction_reliable"),
        layout_unreliable_reason=payload.get("layout_unreliable_reason"),
        cpu_pipeline=None,
        document_representation=None,
        extracted_facts=None,
        preview_pdf=preview_pdf,
        images=images,
    )


def extraction_result_to_wire(result: ExtractionResult) -> dict[str, Any]:
    return {
        "text": result.text,
        "fields": [
            {"key": f.key, "value": f.value, "confidence": f.confidence} for f in result.fields
        ],
        "field_suggestions": (
            [
                {"key": f.key, "value": f.value, "confidence": f.confidence}
                for f in (result.field_suggestions or [])
            ]
            if result.field_suggestions is not None
            else None
        ),
        "blocks": (
            [
                {
                    "page": b.page,
                    "x": b.x,
                    "y": b.y,
                    "width": b.width,
                    "height": b.height,
                    "text": b.text,
                    "block_index": b.block_index,
                }
                for b in (result.blocks or [])
            ]
            if result.blocks is not None
            else None
        ),
        "markdown": result.markdown,
        "layout_ir": result.layout_ir,
        "layout_reconstruction_reliable": result.layout_reconstruction_reliable,
        "layout_unreliable_reason": result.layout_unreliable_reason,
        "preview_pdf_base64": (
            base64.b64encode(result.preview_pdf).decode("ascii") if result.preview_pdf else None
        ),
        "images": (
            [
                {
                    "page": img.page,
                    "x": img.x,
                    "y": img.y,
                    "width": img.width,
                    "height": img.height,
                    "kind": img.kind,
                    "caption": img.caption,
                    "thumbnail_png_base64": base64.b64encode(img.thumbnail_png).decode("ascii"),
                }
                for img in (result.images or [])
            ]
            if result.images
            else None
        ),
    }


def _in_process_extract_allowed() -> bool:
    """In-process extract loads Paddle/ONNX into the API process and caused production OOM."""
    if os.environ.get("DOCUVATE_ALLOW_IN_PROCESS_EXTRACT", "0") != "1":
        return False
    return os.environ.get("DOCUVATE_EXTRACT_SUBPROCESS", "1") == "0"


def _raise_from_envelope(envelope: dict[str, Any]) -> None:
    if envelope.get("ok"):
        return
    error_text = str(envelope.get("error") or "extract subprocess failed")
    error_type = str(envelope.get("error_type") or "RuntimeError")
    tb = envelope.get("traceback")
    if isinstance(tb, list):
        logger.error(
            "extract subprocess traceback:\n%s",
            "".join(str(line) for line in tb),
        )
    permanent = permanent_failure_from_subprocess(
        error_type=error_type,
        reason=error_text,
    )
    if permanent is not None or envelope.get("permanent") is True:
        if permanent is not None:
            raise permanent
        raise ExtractPermanentError(reason=error_text, error_type=error_type)
    raise RuntimeError(error_text)


def _execute_payload(payload: dict[str, Any]) -> dict[str, Any]:
    density = payload.get("embedding_density_state")
    density_state = (
        EmbeddingDensityStatePayload.model_validate(density) if density is not None else None
    )
    try:
        result = extract_document(
            base64.b64decode(str(payload["content_base64"])),
            str(payload["mime_type"]),
            engine=payload.get("engine"),
            embedding_density_state=density_state,
            build_exact_fact_index=bool(payload.get("build_exact_fact_index")),
        )
        return {"ok": True, "result": extraction_result_to_wire(result)}
    except Exception as exc:
        tb_lines = traceback.format_exception(type(exc), exc, exc.__traceback__)
        permanent = permanent_failure_from_subprocess(
            error_type=type(exc).__name__,
            reason=str(exc),
        )
        return {
            "ok": False,
            "error": f"{type(exc).__name__}: {exc}",
            "error_type": type(exc).__name__,
            "traceback": tb_lines,
            "permanent": permanent is not None,
        }


def _run_subprocess_once(payload: dict[str, Any], *, timeout: float) -> dict[str, Any]:
    if extract_pool_enabled() and os.environ.get("DOCUVATE_EXTRACT_CHILD_LOOP") != "1":
        return pooled_extract_child().run_job(payload, timeout=timeout)
    with tempfile.TemporaryFile(mode="w+", encoding="utf-8") as stdout_file:
        proc = subprocess.run(
            [sys.executable, "-m", "docuvate_worker.presentation.extract_subprocess_runner"],
            input=json.dumps(payload),
            stdout=stdout_file,
            stderr=subprocess.PIPE,
            text=True,
            timeout=timeout,
            check=False,
        )
        stdout_file.seek(0)
        raw_out = stdout_file.read()
        if proc.returncode != 0:
            try:
                failed = json.loads(raw_out)
            except json.JSONDecodeError:
                failed = None
            if isinstance(failed, dict) and failed.get("ok") is False:
                return failed
            tail = meaningful_stderr_tail(proc.stderr)
            if tail:
                logger.error("extract subprocess stderr (filtered):\n%s", tail)
            message = subprocess_failure_message(
                proc.returncode,
                proc.stderr,
                stdout_snippet=raw_out[:500] if raw_out else None,
            )
            return {
                "ok": False,
                "error": message,
                "error_type": "RuntimeError",
                "permanent": proc.returncode == -signal.SIGKILL,
            }
        parsed = json.loads(raw_out)
        if not isinstance(parsed, dict):
            raise RuntimeError("extract subprocess returned non-object JSON")
        return parsed


def _sigkill_envelope(envelope: dict[str, Any]) -> bool:
    if envelope.get("ok") is not False:
        return False
    error_text = str(envelope.get("error") or "")
    return "SIGKILL" in error_text


def _resource_exhausted_message() -> str:
    return (
        "Document is too large or memory-intensive for this worker "
        "(zu groß/zu speicherintensiv)."
    )


def _run_extract_subprocess(
    payload: dict[str, Any],
    *,
    timeout: float,
) -> ExtractionResult:
    envelope = _run_subprocess_once(payload, timeout=timeout)
    if _sigkill_envelope(envelope) and not memory_retry_already_applied():
        logger.warning("extract_subprocess_sigkill_retry")
        with apply_memory_retry_overrides():
            envelope = _run_subprocess_once(payload, timeout=timeout)
    if _sigkill_envelope(envelope):
        raise ExtractPermanentError(
            reason=_resource_exhausted_message(),
            error_type="ExtractResourceExhausted",
        )
    _raise_from_envelope(envelope)
    try:
        return extraction_result_from_wire(envelope["result"])
    finally:
        reclaim_python_heap()


def run_extract_isolated(
    *,
    content: bytes,
    mime_type: str,
    engine: str | None,
    embedding_density_state: EmbeddingDensityStatePayload | None,
    build_exact_fact_index: bool,
) -> ExtractionResult:
    configure_onnx_runtime_env()
    if _in_process_extract_allowed():
        logger.warning(
            "DOCUVATE_ALLOW_IN_PROCESS_EXTRACT=1: running extract in-process (not for production)"
        )
        with extract_admission_slot(content, mime_type):
            try:
                return extract_document(
                    content,
                    mime_type,
                    engine=engine,
                    embedding_density_state=embedding_density_state,
                    build_exact_fact_index=build_exact_fact_index,
                )
            finally:
                reclaim_python_heap()
    release_paddle_ocr()
    release_onnx_encoder()
    payload = {
        "content_base64": base64.b64encode(content).decode("ascii"),
        "mime_type": mime_type,
        "engine": engine,
        "embedding_density_state": (
            embedding_density_state.model_dump() if embedding_density_state is not None else None
        ),
        "build_exact_fact_index": build_exact_fact_index,
    }
    timeout = float(os.environ.get("DOCUVATE_EXTRACT_TIMEOUT_SECONDS", "900"))
    with extract_admission_slot(content, mime_type):
        return _run_extract_subprocess(payload, timeout=timeout)


def main() -> None:
    configure_onnx_runtime_env()
    if os.environ.get("DOCUVATE_EXTRACT_CHILD_LOOP") == "1":
        for line in sys.stdin:
            stripped = line.strip()
            if not stripped:
                continue
            payload = json.loads(stripped)
            envelope = _execute_payload(payload)
            sys.stdout.write(json.dumps(envelope) + "\n")
            sys.stdout.flush()
            if not envelope.get("ok"):
                sys.stderr.write(str(envelope.get("error")) + "\n")
        return
    raw = sys.stdin.read()
    payload = json.loads(raw)
    envelope = _execute_payload(payload)
    print(json.dumps(envelope))
    if not envelope.get("ok"):
        sys.exit(1)


if __name__ == "__main__":
    main()
