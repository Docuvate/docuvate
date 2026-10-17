#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Thomas Faust
# SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
"""Core DSRE vs GLiNER benchmark (5 models x CORD/SROIE). GLiNER batch size 1."""

from __future__ import annotations

import json
import resource
import sys
import time
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

from dsre_lib.constants import CORD_SCHEMA, SROIE_SCHEMA, SPLIT_TEST
from dsre_lib.evaluate import candidate_recall, evaluate_head, episode_score_cache, train_head
from dsre_lib.features import HeadKind
from dsre_lib.normalize import normalize_value
from dsre_lib.npz_store import DsreNpz

RESULTS = ROOT / "results"
GLINER_DOC_CAP = 500  # safety cap per dataset test docs


def peak_rss_mb() -> float:
    return float(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss) / 1024.0


def gliner_eval(data: DsreNpz, schema_keys: list[str]) -> dict[str, object]:
    """Earlier DSRE episode-level GLiNER eval (superseded — use ml_pipeline_v010 unified protocol)."""
    from gliner2 import GLiNER2

    t_load = time.perf_counter()
    model = GLiNER2.from_pretrained("fastino/gliner2-base-v1", cache_dir=str(ROOT / ".cache" / "huggingface"))
    load_s = time.perf_counter() - t_load

    doc_fields: dict[str, list[int]] = defaultdict(list)
    for ep in range(len(data.gold)):
        if int(data.split[ep]) != SPLIT_TEST:
            continue
        doc_fields[str(data.doc_id[ep])].append(ep)

    doc_text: dict[str, str] = {}
    for doc_id, eps in doc_fields.items():
        ep0 = eps[0]
        d = int(data.episode_doc[ep0])
        s, e = int(data.offsets[d]), int(data.offsets[d + 1])
        text = "\n".join(dict.fromkeys(str(t) for t in data.candidate_text[s:e]))
        doc_text[doc_id] = text[:3500]

    lat_ms: list[float] = []
    tp = fp = fn = 0
    items = list(doc_fields.items())[:GLINER_DOC_CAP]
    t_infer_start = time.perf_counter()
    for doc_id, eps in items:
        t0 = time.perf_counter()
        out = model.batch_extract_entities([doc_text[doc_id]], entity_types=schema_keys)
        lat_ms.append((time.perf_counter() - t0) * 1000.0)
        ent = out[0].get("entities", {}) if out else {}
        for ep in eps:
            if data.field_absent[ep]:
                continue
            key = schema_keys[int(data.field_key[ep])]
            gold_idx = int(data.gold[ep])
            gold_val = normalize_value(str(data.candidate_text[gold_idx])) if gold_idx >= 0 else ""
            preds = ent.get(key, []) if isinstance(ent, dict) else []
            pred_val = normalize_value(str(preds[0])) if preds else ""
            if not gold_val:
                fn += 1
                continue
            if pred_val == gold_val:
                tp += 1
            else:
                fp += 1
                fn += 1
    infer_s = time.perf_counter() - t_infer_start
    lat_ms.sort()
    mid = lat_ms[len(lat_ms) // 2] if lat_ms else 0.0
    p95 = lat_ms[int(round(0.95 * (len(lat_ms) - 1)))] if len(lat_ms) > 1 else mid
    prec = tp / (tp + fp) if (tp + fp) else 0.0
    rec = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = 2 * prec * rec / (prec + rec) if (prec + rec) else 0.0
    return {
        "micro_precision": prec,
        "micro_recall": rec,
        "micro_f1": f1,
        "latency_ms_per_document_median": mid,
        "latency_ms_per_document_p95": p95,
        "documents_inferred": len(items),
        "model_load_seconds": load_s,
        "total_infer_seconds": infer_s,
        "batch_size": 1,
        "protocol": "dsre_episode_level_npz_text",
    }


def precision_coverage(data: DsreNpz, cache: list[tuple[float, int, int]], out_prefix: Path) -> None:
    thresholds = np.linspace(-1.0, 1.0, 21)
    rows = []
    for tau in thresholds:
        tp = fp = fn = 0
        for ep, (score, pred_idx, gold) in enumerate(cache):
            if int(data.split[ep]) != SPLIT_TEST or data.field_absent[ep]:
                continue
            if score < tau:
                fn += 1
                continue
            if gold >= 0 and pred_idx == gold:
                tp += 1
            else:
                fp += 1
                fn += 1
        prec = tp / (tp + fp) if (tp + fp) else 1.0
        cov = tp / (tp + fn) if (tp + fn) else 0.0
        rows.append((float(tau), prec, cov))
    out_prefix.parent.mkdir(parents=True, exist_ok=True)
    with out_prefix.with_suffix(".csv").open("w", encoding="utf-8") as handle:
        handle.write("threshold,precision,coverage\n")
        for r in rows:
            handle.write(f"{r[0]},{r[1]},{r[2]}\n")
    plt.figure(figsize=(6, 4))
    plt.plot([r[2] for r in rows], [r[1] for r in rows], marker=".")
    plt.xlabel("coverage")
    plt.ylabel("precision")
    plt.title(out_prefix.name)
    plt.grid(True, alpha=0.3)
    plt.savefig(out_prefix.with_suffix(".png"), dpi=120, bbox_inches="tight")
    plt.close()


def dsre_latency_sample(data: DsreNpz, kind: HeadKind, weights, n: int = 150) -> dict[str, float]:
    from dsre_lib.evaluate import score_episode

    lat: list[float] = []
    count = 0
    for ep in range(len(data.gold)):
        if int(data.split[ep]) != SPLIT_TEST:
            continue
        t0 = time.perf_counter()
        score_episode(data, ep, kind, weights)
        lat.append((time.perf_counter() - t0) * 1000.0)
        count += 1
        if count >= n:
            break
    lat.sort()
    if not lat:
        return {"median_ms": 0.0, "p95_ms": 0.0}
    return {
        "median_ms": lat[len(lat) // 2],
        "p95_ms": lat[int(round(0.95 * (len(lat) - 1)))],
        "episodes_sampled": float(len(lat)),
    }


def run_dataset(name: str) -> dict[str, object]:
    npz = ROOT / "data" / f"{name}.npz"
    if not npz.exists():
        raise FileNotFoundError(npz)
    schema = SROIE_SCHEMA if name == "sroie" else CORD_SCHEMA
    schema_keys = [k for k, _, _ in schema]
    data = DsreNpz.load(npz)
    out: dict[str, object] = {
        "dataset": name,
        "candidate_recall": candidate_recall(data),
        "heads": [],
    }
    rel_weights = None
    for kind in HeadKind:
        t0 = time.perf_counter()
        head = evaluate_head(data, kind)
        head["train_eval_seconds"] = time.perf_counter() - t0
        rel_weights = train_head(data, kind) if kind == HeadKind.RELATIONAL else rel_weights
        out["heads"].append(head)
    out_dir = RESULTS / name
    for kind in (HeadKind.COSINE, HeadKind.RELATIONAL):
        w = train_head(data, kind)
        cache = episode_score_cache(data, kind, w)
        precision_coverage(data, cache, out_dir / f"pc_{kind.value}")
    assert rel_weights is not None
    out["dsre_relational_episode_latency"] = dsre_latency_sample(data, HeadKind.RELATIONAL, rel_weights)
    print(f"[{name}] GLiNER2 batch=1...", flush=True)
    out["gliner2"] = gliner_eval(data, schema_keys)
    return out


def main() -> int:
    rss_before = peak_rss_mb()
    t0 = time.perf_counter()
    summary = {
        "skipped": {
            "docker_8g": "Docker not available on benchmark VM",
            "gliner_dsre_rerank": "Not run (prior analysis: not justified)",
            "few_shot_learning_curve": "Not run (runtime cap; script available in run_dsre_benchmark.py)",
            "bootstrap_ci": "Not run (runtime cap)",
        },
        "omp_threads": 4,
        "datasets": {},
        "peak_rss_mb_start": rss_before,
    }
    for ds in ("sroie", "cord"):
        summary["datasets"][ds] = run_dataset(ds)
        path = RESULTS / f"{ds}_dsre_results.json"
        path.write_text(json.dumps(summary["datasets"][ds], indent=2) + "\n", encoding="utf-8")
    summary["peak_rss_mb_end"] = peak_rss_mb()
    summary["total_wall_seconds"] = time.perf_counter() - t0
    (RESULTS / "core_benchmark_summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
