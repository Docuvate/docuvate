# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

"""Run all model gates and optionally ratchet against the committed baseline."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

from bench.model_gates.gates.chat_extractive import run_chat_extractive_gate
from bench.model_gates.gates.chat_routing import run_chat_routing_gate
from bench.model_gates.gates.classification import run_classification_gate
from bench.model_gates.gates.layout_ssim import run_layout_ssim_gate
from bench.model_gates.gates.spark import run_spark_gates
from bench.model_gates.gates.stubs import run_stub_gates
from bench.model_gates.ratchet import (
    compare_to_baseline,
    metric_direction_for,
    harness_measured,
    load_baseline,
    merge_baseline_with_measured,
    write_baseline,
)
from bench.model_gates.schema import CommittedBaseline, GateRunResult, HarnessResult

BASELINE_VERSION = 1


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _default_baseline_path() -> Path:
    return Path(__file__).resolve().parent / "baseline.json"


def _chat_fixtures_path() -> Path:
    return Path(__file__).resolve().parent / "fixtures" / "chat_extractive_cases.json"


def _excluded_gate_ids() -> frozenset[str]:
    raw = os.environ.get("MODEL_GATES_EXCLUDE", "").strip()
    if not raw:
        return frozenset()
    return frozenset(part.strip() for part in raw.split(",") if part.strip())


def run_harness(excluded: frozenset[str] | None = None) -> HarnessResult:
    skip = excluded if excluded is not None else _excluded_gate_ids()
    root = _repo_root()
    gates: list[GateRunResult] = []
    if "chat_extractive" not in skip:
        gates.append(run_chat_extractive_gate(_chat_fixtures_path()))
    if "chat_routing" not in skip:
        gates.append(run_chat_routing_gate())
    if "classification" not in skip:
        gates.append(run_classification_gate())
    if "layout_ssim" not in skip:
        gates.append(run_layout_ssim_gate(root))
    if "spark" not in skip:
        gates.extend(run_spark_gates())
    gates.extend(run_stub_gates())
    return HarnessResult(version=BASELINE_VERSION, gates=tuple(gates))


def _gate_to_json(gate: GateRunResult) -> dict[str, object]:
    return {
        "gate_id": gate.gate_id,
        "status": gate.status,
        "detail": gate.detail,
        "metrics": [
            {"name": m.name, "value": m.value, "direction": m.direction} for m in gate.metrics
        ],
    }


def harness_to_json(result: HarnessResult) -> dict[str, object]:
    measured = harness_measured(result)
    return {
        "version": result.version,
        "measured": measured,
        "gates": [_gate_to_json(g) for g in result.gates],
    }


def run_check(
    *,
    update_baseline: bool,
    baseline_path: Path,
) -> tuple[HarnessResult, dict[str, float], list[str], int]:
    result = run_harness()
    measured = harness_measured(result)
    messages: list[str] = []
    exit_code = 0

    if update_baseline:
        if baseline_path.is_file():
            baseline = load_baseline(baseline_path)
            merged = merge_baseline_with_measured(baseline, measured)
        else:
            merged = CommittedBaseline(
                version=BASELINE_VERSION,
                metrics=dict(measured),
                metric_direction={k: metric_direction_for(k) for k in measured},
            )
        write_baseline(baseline_path, merged)
        messages.append(f"Updated baseline at {baseline_path.name}")
        return result, measured, messages, 0

    if not baseline_path.is_file():
        messages.append(f"Missing baseline: {baseline_path}")
        return result, measured, messages, 1

    baseline = load_baseline(baseline_path)
    violations = compare_to_baseline(measured, baseline, only_keys=frozenset(measured.keys()))
    for v in violations:
        if v.direction == "higher_is_better":
            messages.append(
                f"REGRESSION {v.metric}: {v.measured:.6f} < baseline {v.baseline:.6f}"
            )
        else:
            messages.append(
                f"REGRESSION {v.metric}: {v.measured:.6f} > baseline {v.baseline:.6f}"
            )
    if violations:
        exit_code = 1
    else:
        for key, value in sorted(measured.items()):
            floor = baseline.metrics[key]
            messages.append(f"OK {key}={value:.6f} (baseline {floor:.6f})")
    return result, measured, messages, exit_code


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Docuvate CE model quality gates (CPU)")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail when measured metrics regress vs bench/model_gates/baseline.json",
    )
    parser.add_argument(
        "--update-baseline",
        action="store_true",
        help="Ratchet baseline upward (never lowers floors silently)",
    )
    parser.add_argument(
        "--baseline",
        type=Path,
        default=_default_baseline_path(),
        help="Path to committed baseline JSON",
    )
    args = parser.parse_args(argv)

    if args.check and args.update_baseline:
        print("Choose only one of --check or --update-baseline", flush=True)
        return 2

    result, _measured, messages, exit_code = run_check(
        update_baseline=args.update_baseline,
        baseline_path=args.baseline,
    )
    payload = harness_to_json(result)
    print(json.dumps(payload, indent=2, sort_keys=True), flush=True)
    for line in messages:
        print(line, flush=True)

    if args.check:
        return exit_code
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
