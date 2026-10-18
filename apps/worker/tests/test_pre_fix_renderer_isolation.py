"""Pre-fix renderer loader isolation and per-fix SSIM attribution."""

from __future__ import annotations

import shutil
import subprocess
from collections import defaultdict

import pytest

from docuvate_worker.infrastructure.layout.extract import extract_layout_pdf_bytes
from docuvate_worker.infrastructure.layout.layout_reconstruction_eval import (
    evaluate_exact_typst_reconstruction,
)
from docuvate_worker.infrastructure.layout.pixel_compare import DEFAULT_COMPARE_DPI
from docuvate_worker.infrastructure.layout.render_typst import layout_ir_to_typst
from tests.helpers.layout_ir_fix_signals import (
    analyze_layout_ir_fix_signals,
    pre_typst_lacks_post_fix_markers,
    typst_pre_and_post,
    typst_renderer_fix_triggers,
)
from tests.helpers.pre_fix_typst import typst_from_pre_fix_renderer
from tests.layout_ssim_catalog import LAYOUT_SSIM_FIXTURES, LayoutSsimFixture

_FIX_LABELS = (
    "vertical_line_90deg",
    "scale_origin_left",
    "helvetica_metric_width",
    "baseline_top_edge",
)


def _require_pixel_compare_tools() -> None:
    if shutil.which("typst") is None:
        pytest.fail("typst CLI is required in CI")
    try:
        subprocess.run(["pdftoppm", "-v"], check=True, capture_output=True, text=True)
    except (FileNotFoundError, subprocess.CalledProcessError):
        pytest.fail("poppler-utils (pdftoppm) is required for layout pixel-compare tests")


def _fixture_ssim_delta(fixture: LayoutSsimFixture) -> tuple[float, float, float]:
    pdf = fixture.factory()
    doc = extract_layout_pdf_bytes(pdf)
    assert doc is not None
    pre_src = typst_from_pre_fix_renderer(doc)
    post_src = layout_ir_to_typst(doc)
    before_eval = evaluate_exact_typst_reconstruction(
        pdf,
        category=fixture.category,
        fixture_id=fixture.fixture_id,
        ssim_floor=0.0,
        dpi=DEFAULT_COMPARE_DPI,
        typst_source=pre_src,
    )
    after_eval = evaluate_exact_typst_reconstruction(
        pdf,
        category=fixture.category,
        fixture_id=fixture.fixture_id,
        ssim_floor=0.0,
        dpi=DEFAULT_COMPARE_DPI,
        typst_source=post_src,
    )
    assert before_eval.aggregate_ssim is not None
    assert after_eval.aggregate_ssim is not None
    before = before_eval.aggregate_ssim
    after = after_eval.aggregate_ssim
    return before, after, after - before


@pytest.mark.parametrize("fixture", LAYOUT_SSIM_FIXTURES, ids=lambda f: f.fixture_id)
def test_pre_fix_loader_stays_isolated_across_fixtures(fixture: LayoutSsimFixture) -> None:
    if not fixture.expects_reliable:
        pytest.skip("unreliable fixtures skip typst compare")
    pdf = fixture.factory()
    doc = extract_layout_pdf_bytes(pdf)
    assert doc is not None
    pre, post = typst_pre_and_post(doc)
    signals = analyze_layout_ir_fix_signals(doc)
    if not signals.triggers_any_fix:
        pytest.skip(f"{fixture.fixture_id} has no renderer-fix triggers in IR")
    assert pre != post, f"{fixture.fixture_id}: pre-fix Typst must differ from post-fix"
    assert pre_typst_lacks_post_fix_markers(pre), (
        f"{fixture.fixture_id}: pre-fix Typst must not contain post-fix markers"
    )


def test_pre_fix_typst_differs_on_second_fixture_after_first() -> None:
    """Regression: global sys.modules swap must not make later 'pre' outputs post-fix."""
    first = next(f for f in LAYOUT_SSIM_FIXTURES if f.fixture_id == "delivery_note_table")
    second = next(f for f in LAYOUT_SSIM_FIXTURES if f.fixture_id == "layout_regression_payroll")
    for fixture in (first, second):
        pdf = fixture.factory()
        doc = extract_layout_pdf_bytes(pdf)
        assert doc is not None
        pre = typst_from_pre_fix_renderer(doc)
        post = layout_ir_to_typst(doc)
        assert pre != post, fixture.fixture_id


def test_each_renderer_fix_raises_ssim_on_at_least_two_fixtures() -> None:
    _require_pixel_compare_tools()
    wins: dict[str, list[str]] = defaultdict(list)
    for fixture in LAYOUT_SSIM_FIXTURES:
        if not fixture.expects_reliable:
            continue
        pdf = fixture.factory()
        doc = extract_layout_pdf_bytes(pdf)
        if doc is None:
            continue
        pre_src = typst_from_pre_fix_renderer(doc)
        post_src = layout_ir_to_typst(doc)
        signals = analyze_layout_ir_fix_signals(doc)
        before, after, delta = _fixture_ssim_delta(fixture)
        flags = typst_renderer_fix_triggers(pre_src, post_src, signals)
        for fix_name, triggered in flags.items():
            if triggered and delta >= 0.01:
                wins[fix_name].append(fixture.fixture_id)
    missing = [name for name in _FIX_LABELS if len(wins[name]) < 2]
    assert not missing, f"fixes need >=2 fixtures with delta>=0.01: { {k: wins[k] for k in missing} }"


def test_layout_fix_signals_report(capsys: pytest.CaptureFixture[str]) -> None:
    _require_pixel_compare_tools()
    lines = ["Layout renderer fix signals (per reliable fixture)", ""]
    for fixture in LAYOUT_SSIM_FIXTURES:
        if not fixture.expects_reliable:
            continue
        pdf = fixture.factory()
        doc = extract_layout_pdf_bytes(pdf)
        if doc is None:
            continue
        pre_src = typst_from_pre_fix_renderer(doc)
        post_src = layout_ir_to_typst(doc)
        signals = analyze_layout_ir_fix_signals(doc)
        before, after, delta = _fixture_ssim_delta(fixture)
        flags = typst_renderer_fix_triggers(pre_src, post_src, signals)
        triggered = [k for k, v in flags.items() if v]
        lines.append(
            f"{fixture.fixture_id}: v={signals.vertical_lines} sx={signals.scaled_runs} "
            f"helv={signals.helvetica_runs} upright={signals.upright_runs} "
            f"before={before:.4f} after={after:.4f} delta={delta:+.4f} fixes={','.join(triggered)}"
        )
    print("\n".join(lines))
    assert lines
