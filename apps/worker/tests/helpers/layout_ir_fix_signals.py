"""Count layout-IR features that the four Typst renderer fixes address."""

from __future__ import annotations

from dataclasses import dataclass

from docuvate_worker.domain.layout_ir import (
    LayoutIrDocument,
    LayoutIrVectorKind,
)
from docuvate_worker.infrastructure.layout.font_map import uses_metric_typst_substitute
from docuvate_worker.infrastructure.layout.render_run import run_scale_x
from docuvate_worker.infrastructure.layout.render_typst import layout_ir_to_typst
from tests.helpers.pre_fix_typst import typst_from_pre_fix_renderer


@dataclass(frozen=True)
class LayoutIrFixSignals:
    vertical_lines: int
    scaled_runs: int
    helvetica_runs: int
    upright_runs: int

    @property
    def triggers_any_fix(self) -> bool:
        return (
            self.vertical_lines > 0
            or self.scaled_runs > 0
            or self.helvetica_runs > 0
            or self.upright_runs > 0
        )


def _is_upright_block(block) -> bool:
    if block.rotation_deg is not None and abs(block.rotation_deg) >= 0.5:
        return False
    if block.matrix is None:
        return True
    _a, b, c, _d, _e, _f = block.matrix
    return abs(b) < 0.05 and abs(c) < 0.05


def analyze_layout_ir_fix_signals(doc: LayoutIrDocument) -> LayoutIrFixSignals:
    vertical_lines = 0
    scaled_runs = 0
    helvetica_runs = 0
    upright_runs = 0
    for page in doc.pages:
        for vector in page.vectors:
            if vector.kind != LayoutIrVectorKind.LINE:
                continue
            w = vector.width * page.width_pt
            h = vector.height * page.height_pt
            if h > w:
                vertical_lines += 1
        for block in page.blocks:
            if _is_upright_block(block):
                upright_runs += 1
            if uses_metric_typst_substitute(block.font_family):
                helvetica_runs += 1
            sx = run_scale_x(block, page)
            if abs(sx - 1.0) > 0.015:
                scaled_runs += 1
    return LayoutIrFixSignals(
        vertical_lines=vertical_lines,
        scaled_runs=scaled_runs,
        helvetica_runs=helvetica_runs,
        upright_runs=upright_runs,
    )


def pre_typst_lacks_post_fix_markers(pre_typst: str) -> bool:
    if "angle: 90deg" in pre_typst:
        return False
    if 'top-edge: "baseline"' in pre_typst:
        return False
    if "%, origin: left)" in pre_typst:
        return False
    return True


def typst_pre_and_post(doc: LayoutIrDocument) -> tuple[str, str]:
    return typst_from_pre_fix_renderer(doc), layout_ir_to_typst(doc)


def typst_renderer_fix_triggers(
    pre_typst: str,
    post_typst: str,
    signals: LayoutIrFixSignals,
) -> dict[str, bool]:
    scale_origin = (
        "#scale(x:" in pre_typst
        and "#scale(x:" in post_typst
        and "%, origin: left)" in post_typst
        and "%, origin: left)" not in pre_typst
    )
    helvetica_metric = signals.helvetica_runs > 0 and (
        "#scale(x:" in pre_typst and "#scale(x:" not in post_typst
    )
    return {
        "vertical_line_90deg": signals.vertical_lines > 0,
        "scale_origin_left": scale_origin,
        "helvetica_metric_width": helvetica_metric,
        "baseline_top_edge": signals.upright_runs > 0
        and 'top-edge: "baseline"' in post_typst
        and 'top-edge: "baseline"' not in pre_typst,
    }
