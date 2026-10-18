# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

from __future__ import annotations

from docuvate_worker.domain.cpu_pipeline.contracts import PipelineMutableState
from docuvate_worker.domain.layout_ir import LayoutIrDocument


def get_or_extract_layout_pdf(state: PipelineMutableState) -> LayoutIrDocument | None:
    if state.mime_type != "application/pdf":
        return None
    if state.cached_layout_pdf is not None:
        return state.cached_layout_pdf
    if state.prebuilt_layout_ir is not None:
        state.cached_layout_pdf = state.prebuilt_layout_ir
        return state.cached_layout_pdf
    try:
        from docuvate_worker.infrastructure.layout.extract import (  # noqa: PLC0415
            extract_layout_pdf_bytes,
        )
    except Exception:
        return None
    layout = extract_layout_pdf_bytes(state.content)
    state.cached_layout_pdf = layout
    if layout is not None and state.prebuilt_layout_ir is None:
        state.prebuilt_layout_ir = layout
    return layout
