"""
Full CPU benchmark: corpus generation, models A–H, metrics, plots, JSON export.
"""

from __future__ import annotations

import argparse
import json
import os
import platform
import resource
import statistics
import time
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

# Ensure src on path when run as script
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from baselines import train_model  # noqa: E402
from data_generator import generate_corpus, save_corpus  # noqa: E402
from evaluate import evaluate_bundle  # noqa: E402
from train import prepare_learned_B, train_all  # noqa: E402
from algebra import geometric_B_d2, learn_B_ridge, mul, AlgebraElement  # noqa: E402
from tensor_algebra import mul_trunc, encode_position  # noqa: E402
from features import layout_signals_from_doc, cross_bispectrum_1d  # noqa: E402


def hardware_info() -> dict:
    return {
        "python": platform.python_version(),
        "machine": platform.machine(),
        "cpu_count": os.cpu_count(),
        "platform": platform.platform(),
        "threads_blas": os.environ.get("OMP_NUM_THREADS", "default"),
    }


def bispectrum_translation_test() -> dict:
    """Numerical check: shifting 1D signal changes bispectrum (not translation invariant)."""
    t = np.linspace(0, 1, 64)
    sig = np.sin(2 * np.pi * 3 * t)
    sig_shift = np.sin(2 * np.pi * 3 * (t + 0.1))
    b0 = cross_bispectrum_1d([sig, sig, sig], n_freq=8)
    b1 = cross_bispectrum_1d([sig_shift, sig_shift, sig_shift], n_freq=8)
    diff = float(np.linalg.norm(b0 - b1))
    # analytic: phase rotation; not invariant under absolute coordinates
    return {"l2_diff_after_shift": diff, "translation_invariant": diff < 1e-9}


def geometry_ablation() -> dict:
    B = geometric_B_d2()
    rng = np.random.default_rng(0)
    u = rng.normal(size=2)
    v = rng.normal(size=2)
    base = B.evaluate(u, v)
    # translation on u only (absolute B changes unless using differences)
    u_tr = u + np.array([1.0, 0.5])
    tr = B.evaluate(u_tr, v)
    diff_vec = B.evaluate(u - v, v - u)  # difference vectors
    return {
        "B_base": base.tolist(),
        "B_after_translate_u": tr.tolist(),
        "translation_invariant_for_B": bool(np.allclose(base, tr)),
        "antisymmetric_component": float(base[1] + B.evaluate(v, u)[1]),
        "diff_vector_pair": diff_vec.tolist(),
    }


def run_seeds(
    n_docs: int,
    seeds: list[int],
    results_dir: Path,
) -> dict:
    all_metrics = []
    for seed in seeds:
        docs = generate_corpus(n_docs, seed)
        save_corpus(docs, results_dir)
        train_docs = [d.to_dict() for d in docs if d.split == "train"]
        test_docs = [d.to_dict() for d in docs if d.split == "test"]
        ood_docs = [d.to_dict() for d in docs if d.split == "ood"]
        bundles = train_all(train_docs, seed=seed)
        for key, bundle in bundles.items():
            for split_name, split_docs in [("test", test_docs), ("ood", ood_docs)]:
                if not split_docs:
                    continue
                m = evaluate_bundle(bundle, split_docs, split_name)
                m["seed"] = seed
                all_metrics.append(m)
    return {"runs": all_metrics}


def confidence_intervals(values: list[float]) -> dict:
    if len(values) < 2:
        v = values[0] if values else 0.0
        return {"mean": v, "std": 0.0, "ci95_low": v, "ci95_high": v}
    mean = statistics.mean(values)
    std = statistics.pstdev(values)
    half = 1.96 * std / max(1, len(values) ** 0.5)
    return {"mean": mean, "std": std, "ci95_low": mean - half, "ci95_high": mean + half}


def aggregate(metrics: list[dict]) -> list[dict]:
    from collections import defaultdict

    bucket: dict[tuple[str, str], list[float]] = defaultdict(list)
    for m in metrics:
        bucket[(m["model"], m["split"])].append(m["p1_macro_f1"])
    rows = []
    for (model, split), vals in sorted(bucket.items()):
        ci = confidence_intervals(vals)
        rows.append({"model": model, "split": split, **ci})
    return rows


def plot_comparison(agg: list[dict], out: Path) -> None:
    test_rows = [r for r in agg if r["split"] == "test"]
    if not test_rows:
        return
    models = [r["model"] for r in test_rows]
    means = [r["mean"] for r in test_rows]
    errs = [(r["ci95_high"] - r["ci95_low"]) / 2 for r in test_rows]
    fig, ax = plt.subplots(figsize=(10, 4))
    ax.bar(models, means, yerr=errs, capsize=3)
    ax.set_ylabel("P1 macro F1 (test)")
    ax.set_title("Semantic role classification — synthetic corpus")
    fig.tight_layout()
    out.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out, dpi=120)
    plt.close(fig)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--n-docs", type=int, default=2000)
    parser.add_argument("--seeds", type=str, default="42,43,44")
    parser.add_argument("--results", type=Path, default=ROOT / "results")
    args = parser.parse_args()
    results_dir = args.results
    results_dir.mkdir(parents=True, exist_ok=True)

    t0 = time.perf_counter()
    seed_list = [int(s) for s in args.seeds.split(",")]
    hw = hardware_info()
    hw["warmup_s"] = 0.0
    # warmup
    warm = [d.to_dict() for d in generate_corpus(30, 0) if d.split == "train"][:10]
    _ = train_model(warm, "A")

    geom = geometry_ablation()
    bis = bispectrum_translation_test()

    run_data = run_seeds(args.n_docs, seed_list, results_dir)
    agg = aggregate(run_data["runs"])
    wall = time.perf_counter() - t0
    peak = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss

    summary = {
        "hardware": hw,
        "n_docs_per_seed": args.n_docs,
        "seeds": seed_list,
        "wall_time_s": wall,
        "peak_ram_kb": peak,
        "geometry_ablation": geom,
        "bispectrum_translation": bis,
        "aggregated_p1_macro_f1": agg,
        "hypothesis_notes": {
            "H0": "Compare E/F/G vs B2/B3 in aggregated table",
            "H1": "Parameter counts in per-run metrics",
        },
    }
    with (results_dir / "summary.json").open("w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    with (results_dir / "all_metrics.json").open("w", encoding="utf-8") as f:
        json.dump(run_data, f, indent=2)

    import csv

    with (results_dir / "aggregated.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["model", "split", "mean", "std", "ci95_low", "ci95_high"])
        w.writeheader()
        w.writerows(agg)

    plot_comparison(agg, results_dir / "figures" / "p1_macro_f1_test.png")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
