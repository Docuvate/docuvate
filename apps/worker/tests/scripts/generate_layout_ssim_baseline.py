"""Regenerate frozen main-branch SSIM baseline (run manually after renderer changes)."""

from __future__ import annotations

import json
from pathlib import Path

from docuvate_worker.infrastructure.layout.extract import extract_layout_pdf_bytes
from docuvate_worker.infrastructure.layout.layout_reconstruction_eval import (
    evaluate_exact_typst_reconstruction,
)
from docuvate_worker.infrastructure.layout.pixel_compare import DEFAULT_COMPARE_DPI
from tests.helpers.pre_fix_typst import typst_from_pre_fix_renderer
from tests.layout_ssim_catalog import LAYOUT_SSIM_FIXTURES

OUT = Path(__file__).resolve().parents[1] / "fixtures" / "layout_ssim_baseline_main.json"


def main() -> None:
    fixtures: dict[str, dict[str, float | str]] = {}
    for entry in LAYOUT_SSIM_FIXTURES:
        if not entry.expects_reliable:
            continue
        pdf = entry.factory()
        doc = extract_layout_pdf_bytes(pdf)
        assert doc is not None
        before_src = typst_from_pre_fix_renderer(doc)
        before_eval = evaluate_exact_typst_reconstruction(
            pdf,
            category=entry.category,
            fixture_id=entry.fixture_id,
            ssim_floor=0.0,
            dpi=DEFAULT_COMPARE_DPI,
            typst_source=before_src,
        )
        assert before_eval.aggregate_ssim is not None
        fixtures[entry.fixture_id] = {
            "category": entry.category,
            "before_ssim": round(before_eval.aggregate_ssim, 6),
        }
    payload = {"version": 1, "dpi": DEFAULT_COMPARE_DPI, "fixtures": fixtures}
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} ({len(fixtures)} fixtures)")


if __name__ == "__main__":
    main()
