"""Dispatch layout IR → Typst by export mode."""

from __future__ import annotations

from docuvate_worker.domain.layout_ir import LayoutIrDocument
from docuvate_worker.infrastructure.layout.render_typst import layout_ir_to_typst_exakt
from docuvate_worker.infrastructure.layout.render_typst_semantic import layout_ir_to_typst_semantic
from docuvate_worker.infrastructure.layout.typst_export_mode import TypstExportMode


def layout_ir_to_typst_for_mode(doc: LayoutIrDocument, mode: TypstExportMode) -> str:
    if mode == TypstExportMode.SEMANTISCH:
        return layout_ir_to_typst_semantic(doc)
    if mode == TypstExportMode.EXAKT:
        return layout_ir_to_typst_exakt(doc)
    raise ValueError(f"Unsupported typst export mode: {mode}")
