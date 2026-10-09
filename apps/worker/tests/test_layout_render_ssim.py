"""SSIM regression catalog: categories, baseline JSON, graceful eval."""

from __future__ import annotations

import json
import shutil
import subprocess
from collections import defaultdict
from pathlib import Path

import pytest

from docuvate_worker.infrastructure.layout.extract import extract_layout_pdf_bytes
from docuvate_worker.infrastructure.layout.layout_reconstruction_assess import (
    assess_layout_reconstruction,
)
from docuvate_worker.infrastructure.layout.layout_reconstruction_eval import (
    CATEGORY_SSIM_FLOOR,
    ReconstructionUnreliableReason,
    evaluate_exact_typst_reconstruction,
    ssim_floor_for_category,
)
from docuvate_worker.infrastructure.layout.pixel_compare import DEFAULT_COMPARE_DPI
from tests.helpers.pre_fix_typst import typst_from_pre_fix_renderer
from tests.layout_ssim_catalog import LAYOUT_SSIM_FIXTURES, LayoutSsimFixture

_BASELINE_PATH = Path(__file__).resolve().parent / "fixtures" / "layout_ssim_baseline_main.json"


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


def _load_baseline() -> dict[str, float]:
    assert _BASELINE_PATH.is_file(), f"Missing SSIM baseline: {_BASELINE_PATH}"
    payload = json.loads(_BASELINE_PATH.read_text(encoding="utf-8"))
    fixtures = payload.get("fixtures")
    assert isinstance(fixtures, dict) and fixtures, "baseline fixtures must be non-empty"
    out: dict[str, float] = {}
    for fixture_id, entry in fixtures.items():
        assert "before_ssim" in entry, f"baseline entry {fixture_id} missing before_ssim"
        out[fixture_id] = float(entry["before_ssim"])
    return out


def _evaluate_fixture(fixture: LayoutSsimFixture):
    pdf = fixture.factory()
    if not fixture.expects_reliable and fixture.expected_unreliable_reason in {
        ReconstructionUnreliableReason.UNSUPPORTED_SCRIPT,
        ReconstructionUnreliableReason.SCAN_WITHOUT_TEXT_LAYER,
    }:
        doc = extract_layout_pdf_bytes(pdf)
        return assess_layout_reconstruction(
            doc,
            pdf,
            fixture_id=fixture.fixture_id,
            category=fixture.category,
            ssim_floor=fixture.ssim_floor,
        )
    return evaluate_exact_typst_reconstruction(
        pdf,
        category=fixture.category,
        fixture_id=fixture.fixture_id,
        ssim_floor=fixture.ssim_floor,
        dpi=DEFAULT_COMPARE_DPI,
    )


@pytest.mark.parametrize("fixture", LAYOUT_SSIM_FIXTURES, ids=lambda f: f.fixture_id)
def test_layout_reconstruction_fidelity(fixture: LayoutSsimFixture) -> None:
    _require_pixel_compare_tools()
    eval_result = _evaluate_fixture(fixture)
    if fixture.expects_reliable:
        assert eval_result.reconstruction_reliable, (
            f"{fixture.fixture_id} ({fixture.category}): "
            f"{eval_result.unreliable_reason} — {eval_result.detail} "
            f"(aggregate SSIM {eval_result.aggregate_ssim})"
        )
        assert eval_result.aggregate_ssim is not None
        assert eval_result.aggregate_ssim >= fixture.ssim_floor
    else:
        assert not eval_result.reconstruction_reliable
        assert eval_result.unreliable_reason == fixture.expected_unreliable_reason


@pytest.mark.parametrize("fixture", LAYOUT_SSIM_FIXTURES, ids=lambda f: f.fixture_id)
def test_after_ssim_not_below_frozen_main_baseline(fixture: LayoutSsimFixture) -> None:
    _require_pixel_compare_tools()
    if not fixture.expects_reliable:
        pytest.skip("no SSIM baseline for intentionally unreliable fixtures")
    baseline = _load_baseline()
    assert fixture.fixture_id in baseline, f"baseline missing fixture {fixture.fixture_id}"
    pdf = fixture.factory()
    doc = extract_layout_pdf_bytes(pdf)
    assert doc is not None
    before_src = typst_from_pre_fix_renderer(doc)
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
    frozen = baseline[fixture.fixture_id]
    assert abs(before_eval.aggregate_ssim - frozen) < 0.01, (
        f"{fixture.fixture_id}: live before {before_eval.aggregate_ssim:.4f} "
        f"!= frozen baseline {frozen:.4f}"
    )
    assert after_eval.aggregate_ssim >= frozen - 0.002, (
        f"{fixture.fixture_id}: after {after_eval.aggregate_ssim:.4f} < baseline {frozen:.4f}"
    )


def test_eval_marks_unreliable_without_crashing_on_empty_pdf() -> None:
    result = evaluate_exact_typst_reconstruction(
        b"%PDF-1.4\n%%EOF\n",
        category="born_digital_standard",
        fixture_id="empty",
        ssim_floor=0.97,
    )
    assert not result.reconstruction_reliable


def test_category_floors_cover_catalog() -> None:
    for fixture in LAYOUT_SSIM_FIXTURES:
        assert fixture.category in CATEGORY_SSIM_FLOOR
        assert fixture.ssim_floor == ssim_floor_for_category(fixture.category)


def test_layout_ssim_report_by_category(capsys: pytest.CaptureFixture[str]) -> None:
    _require_pixel_compare_tools()
    baseline = _load_baseline()
    by_category: dict[str, list[tuple[str, float, float, bool]]] = defaultdict(list)
    for fixture in LAYOUT_SSIM_FIXTURES:
        pdf = fixture.factory()
        doc = extract_layout_pdf_bytes(pdf)
        after_eval = _evaluate_fixture(fixture)
        before_ssim = baseline.get(fixture.fixture_id, 0.0)
        if fixture.expects_reliable and fixture.fixture_id in baseline and doc is not None:
            before_src = typst_from_pre_fix_renderer(doc)
            before_eval = evaluate_exact_typst_reconstruction(
                pdf,
                category=fixture.category,
                fixture_id=fixture.fixture_id,
                ssim_floor=0.0,
                typst_source=before_src,
            )
            before_ssim = before_eval.aggregate_ssim or before_ssim
        after_ssim = after_eval.aggregate_ssim or 0.0
        by_category[fixture.category].append(
            (fixture.fixture_id, before_ssim, after_ssim, after_eval.reconstruction_reliable)
        )

    lines = ["Layout SSIM report (100 dpi)", ""]
    for category in sorted(by_category):
        floor = CATEGORY_SSIM_FLOOR[category]
        lines.append(f"## {category} (floor {floor:.2f})")
        for fid, before, after, reliable in by_category[category]:
            flag = "ok" if reliable else "unreliable"
            lines.append(f"  {fid}: before={before:.4f} after={after:.4f} [{flag}]")
        vals = [a for _, _, a, rel in by_category[category] if rel]
        if vals:
            lines.append(f"  category min after (reliable): {min(vals):.4f}")
        lines.append("")
    print("\n".join(lines))
    assert by_category
