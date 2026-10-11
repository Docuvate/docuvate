# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Layout pixel-compare SSIM gate (reuses worker SSIM catalog + frozen baseline)."""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

from docuvate_worker.infrastructure.layout.layout_reconstruction_eval import (
    evaluate_exact_typst_reconstruction,
)
from docuvate_worker.infrastructure.layout.pixel_compare import DEFAULT_COMPARE_DPI
from tests.layout_ssim_catalog import LAYOUT_SSIM_FIXTURES

from bench.model_gates.json_models import LayoutSsimBaselineFile
from bench.model_gates.schema import GateRunResult, MetricValue

GATE_ID = "layout_ssim"


def _require_pixel_compare_tools() -> str | None:
    if shutil.which("typst") is None:
        return "typst CLI missing"
    try:
        subprocess.run(
            ["pdftoppm", "-v"],
            check=True,
            capture_output=True,
            text=True,
        )
    except (FileNotFoundError, subprocess.CalledProcessError):
        return "poppler-utils (pdftoppm) missing"
    return None


def _load_frozen_baseline(repo_root: Path) -> dict[str, float]:
    path = (
        repo_root
        / "apps"
        / "worker"
        / "tests"
        / "fixtures"
        / "layout_ssim_baseline_main.json"
    )
    payload = LayoutSsimBaselineFile.model_validate_json(path.read_text(encoding="utf-8"))
    out: dict[str, float] = {}
    for fixture_id, entry in payload.fixtures.items():
        out[fixture_id] = entry.before_ssim
    return out


def run_layout_ssim_gate(repo_root: Path) -> GateRunResult:
    tool_err = _require_pixel_compare_tools()
    if tool_err is not None:
        return GateRunResult(gate_id=GATE_ID, status="error", metrics=(), detail=tool_err)

    frozen = _load_frozen_baseline(repo_root)
    margins: list[float] = []
    min_after = 1.0

    for fixture in LAYOUT_SSIM_FIXTURES:
        if not fixture.expects_reliable:
            continue
        if fixture.fixture_id not in frozen:
            continue
        pdf = fixture.factory()
        after_eval = evaluate_exact_typst_reconstruction(
            pdf,
            category=fixture.category,
            fixture_id=fixture.fixture_id,
            ssim_floor=0.0,
            dpi=DEFAULT_COMPARE_DPI,
        )
        if after_eval.aggregate_ssim is None:
            continue
        baseline_val = frozen[fixture.fixture_id]
        margin = after_eval.aggregate_ssim - baseline_val
        margins.append(margin)
        min_after = min(min_after, after_eval.aggregate_ssim)

    if not margins:
        return GateRunResult(
            gate_id=GATE_ID,
            status="error",
            metrics=(),
            detail="no reliable fixtures evaluated",
        )

    worst_margin = min(margins)
    metrics = (
        MetricValue(
            name=f"{GATE_ID}.worst_margin",
            value=worst_margin,
            direction="higher_is_better",
        ),
        MetricValue(
            name=f"{GATE_ID}.min_after_ssim",
            value=min_after,
            direction="higher_is_better",
        ),
    )
    return GateRunResult(
        gate_id=GATE_ID,
        status="ok",
        metrics=metrics,
        detail=f"{len(margins)} fixtures",
    )
