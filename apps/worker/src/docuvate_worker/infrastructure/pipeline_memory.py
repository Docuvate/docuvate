# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Release heavy PDF bytes from pipeline state once layout/OCR artifacts exist."""

from __future__ import annotations

import os

from docuvate_worker.domain.cpu_pipeline.contracts import PipelineMutableState
from docuvate_worker.infrastructure.worker_memory_hygiene import reclaim_python_heap


def release_pdf_bytes_after_taco(state: PipelineMutableState) -> None:
    """Drop raw PDF bytes after table/layout extraction to free tens of MB."""
    if os.environ.get("DOCUVATE_RELEASE_PDF_AFTER_TACO", "1") != "1":
        return
    if state.mime_type != "application/pdf":
        return
    if not state.content:
        return
    if not state.text.strip() or not state.blocks:
        return
    state.content = b""
    reclaim_python_heap()
