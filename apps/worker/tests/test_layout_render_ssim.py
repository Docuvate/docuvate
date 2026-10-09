"""SSIM regression catalog: categories, graceful eval, before/after non-regression."""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from collections import defaultdict
from pathlib import Path

import pytest

from docuvate_worker.infrastructure.layout.extract import extract_layout_pdf_bytes
from docuvate_worker.infrastructure.layout.layout_reconstruction_eval import (
    CATEGORY_SSIM_FLOOR,
    ReconstructionUnreliableReason,
    evaluate_exact_typst_reconstruction,
    ssim_floor_for_category,
)
from docuvate_worker.infrastructure.layout.pixel_compare import DEFAULT_COMPARE_DPI
from tests.layout_ssim_catalog import LAYOUT_SSIM_FIXTURES, LayoutSsimFixture

_REPO_ROOT = Path(__file__).resolve().parents[3]
_MAIN_RENDERER_FILES = {
    "render_typst.py": "apps/worker/src/docuvate_worker/infrastructure/layout/render_typst.py",
    "render_run.py": "apps/worker/src/docuvate_worker/infrastructure/layout/render_run.py",
    "text_fit.py": "apps/worker/src/docuvate_worker/infrastructure/layout/text_fit.py",
    "font_map.py": "apps/worker/src/docuvate_worker/infrastructure/layout/font_map.py",
}


def _require_pixel_compare_tools() -> None:
    if shutil.which("typst") is None:
        pytest.fail("typst CLI is required in CI")
    try:
        subprocess.run(
            ["pdftoppm", "-v"],
            check=True,
            capture_output=True,
            text=True,
        )
    except (FileNotFoundError, subprocess.CalledProcessError):
        pytest.fail("poppler-utils (pdftoppm) is required for layout pixel-compare tests")


def _typst_from_main_branch(doc) -> str:
    with tempfile.TemporaryDirectory() as tmp:
        pkg = Path(tmp) / "docuvate_worker" / "infrastructure" / "layout"
        pkg.mkdir(parents=True)
        (pkg / "__init__.py").write_text("")
        for name, rel in _MAIN_RENDERER_FILES.items():
            content = subprocess.check_output(
                ["git", "show", f"main:{rel}"],
                cwd=_REPO_ROOT,
            )
            (pkg / name).write_text(content.decode())
        import sys

        sys.path.insert(0, str(Path(tmp)))
        from docuvate_worker.infrastructure.layout.render_typst import layout_ir_to_typst

        return layout_ir_to_typst(doc)


@pytest.mark.parametrize("fixture", LAYOUT_SSIM_FIXTURES, ids=lambda f: f.fixture_id)
def test_exact_typst_reconstruction_meets_category_floor(fixture: LayoutSsimFixture) -> None:
    _require_pixel_compare_tools()
    pdf = fixture.factory()
    eval_result = evaluate_exact_typst_reconstruction(
        pdf,
        category=fixture.category,
        fixture_id=fixture.fixture_id,
        ssim_floor=fixture.ssim_floor,
        dpi=DEFAULT_COMPARE_DPI,
    )
    assert eval_result.reconstruction_reliable, (
        f"{fixture.fixture_id} ({fixture.category}): "
        f"{eval_result.unreliable_reason} — {eval_result.detail} "
        f"(aggregate SSIM {eval_result.aggregate_ssim})"
    )
    assert eval_result.aggregate_ssim is not None
    assert eval_result.aggregate_ssim >= fixture.ssim_floor


@pytest.mark.parametrize("fixture", LAYOUT_SSIM_FIXTURES, ids=lambda f: f.fixture_id)
def test_typst_reconstruction_not_worse_than_main(fixture: LayoutSsimFixture) -> None:
    """Non-regression vs renderer on main (before fixes)."""
    _require_pixel_compare_tools()
    pdf = fixture.factory()
    doc = extract_layout_pdf_bytes(pdf)
    assert doc is not None
    try:
        before_src = _typst_from_main_branch(doc)
    except subprocess.CalledProcessError:
        pytest.skip("main branch renderer snapshot unavailable")
    after_eval = evaluate_exact_typst_reconstruction(
        pdf,
        category=fixture.category,
        fixture_id=fixture.fixture_id,
        ssim_floor=0.0,
        dpi=DEFAULT_COMPARE_DPI,
    )
    before_eval = evaluate_exact_typst_reconstruction(
        pdf,
        category=fixture.category,
        fixture_id=fixture.fixture_id,
        ssim_floor=0.0,
        dpi=DEFAULT_COMPARE_DPI,
        typst_source=before_src,
    )
    assert after_eval.aggregate_ssim is not None
    assert before_eval.aggregate_ssim is not None
    assert after_eval.aggregate_ssim >= before_eval.aggregate_ssim - 0.002, (
        f"{fixture.fixture_id}: after {after_eval.aggregate_ssim:.4f} "
        f"< before {before_eval.aggregate_ssim:.4f}"
    )


def test_eval_marks_unreliable_without_crashing_on_empty_pdf() -> None:
    result = evaluate_exact_typst_reconstruction(
        b"%PDF-1.4\n%%EOF\n",
        category="born_digital_standard",
        fixture_id="empty",
        ssim_floor=0.97,
    )
    assert not result.reconstruction_reliable
    assert result.unreliable_reason in {
        ReconstructionUnreliableReason.EXTRACTION_FAILED,
        ReconstructionUnreliableReason.RASTERIZE_FAILED,
        ReconstructionUnreliableReason.TYPST_COMPILE_FAILED,
        ReconstructionUnreliableReason.INTERNAL_ERROR,
    }


def test_eval_flags_below_threshold_instead_of_asserting() -> None:
    pdf = next(f for f in LAYOUT_SSIM_FIXTURES if f.fixture_id == "form_disclosure").factory()
    result = evaluate_exact_typst_reconstruction(
        pdf,
        category="born_digital_standard",
        fixture_id="form_disclosure",
        ssim_floor=0.9999,
    )
    assert not result.reconstruction_reliable
    assert result.unreliable_reason == ReconstructionUnreliableReason.BELOW_SSIM_THRESHOLD
    assert result.aggregate_ssim is not None


def test_category_floors_cover_catalog() -> None:
    for fixture in LAYOUT_SSIM_FIXTURES:
        assert fixture.category in CATEGORY_SSIM_FLOOR
        assert fixture.ssim_floor == ssim_floor_for_category(fixture.category)


def test_layout_ssim_report_by_category(capsys: pytest.CaptureFixture[str]) -> None:
    """Print SSIM before/after table (visible with pytest -s)."""
    _require_pixel_compare_tools()
    by_category: dict[str, list[tuple[str, float, float, bool]]] = defaultdict(list)
    for fixture in LAYOUT_SSIM_FIXTURES:
        pdf = fixture.factory()
        doc = extract_layout_pdf_bytes(pdf)
        if doc is None:
            continue
        after_eval = evaluate_exact_typst_reconstruction(
            pdf,
            category=fixture.category,
            fixture_id=fixture.fixture_id,
            ssim_floor=fixture.ssim_floor,
        )
        try:
            before_src = _typst_from_main_branch(doc)
            before_eval = evaluate_exact_typst_reconstruction(
                pdf,
                category=fixture.category,
                fixture_id=fixture.fixture_id,
                ssim_floor=0.0,
                typst_source=before_src,
            )
            before_ssim = before_eval.aggregate_ssim or 0.0
        except subprocess.CalledProcessError:
            before_ssim = 0.0
        after_ssim = after_eval.aggregate_ssim or 0.0
        by_category[fixture.category].append(
            (fixture.fixture_id, before_ssim, after_ssim, after_eval.reconstruction_reliable)
        )

    lines = ["Layout SSIM report (100 dpi, min page SSIM per fixture)", ""]
    for category in sorted(by_category):
        floor = CATEGORY_SSIM_FLOOR[category]
        lines.append(f"## {category} (floor {floor:.2f})")
        for fid, before, after, reliable in by_category[category]:
            flag = "ok" if reliable else "unreliable"
            lines.append(f"  {fid}: before={before:.4f} after={after:.4f} [{flag}]")
        vals = [a for _, _, a, _ in by_category[category]]
        lines.append(f"  category min after: {min(vals):.4f}")
        lines.append("")
    report = "\n".join(lines)
    print(report)
    assert by_category
