# DSRE benchmark report (round 2 — core run complete)

Research: `research/extraction_baseline/dsre/`. **Core benchmark:** `scripts/run_core_benchmark.py` → `results/core_benchmark_summary.json`.

## Skipped (runtime / environment)

| Item | Status |
| --- | --- |
| Docker 4 CPU / 8 GiB | **Not run** — Docker unavailable |
| GLiNER + DSRE rerank | **Not run** — not justified by scores |
| Few-shot learning curve | **Not run** — runtime cap (`run_dsre_benchmark.py` optional) |
| Bootstrap CI | **Not run** — runtime cap |

## Candidate recall

| Dataset | Recall |
| --- | ---: |
| SROIE | **0.645** |
| CORD | **0.933** |

## Test F1 — 5 models (raw top-1, exact span match for DSRE heads)

| Model | SROIE F1 | CORD F1 |
| --- | ---: | ---: |
| E5 cosine | 0.004 | 0.001 |
| E5 + linear ridge | 0.057 | 0.130 |
| E5 + bilinear ridge | 0.056 | 0.130 |
| **DSRE relational** | **0.062** | **0.191** |
| **GLiNER2-base** (batch **1**) | **0.169** | **0.346** |

GLiNER2 in this run uses the **same NPZ test episodes** and normalized value match against gold span text; document text is rebuilt from OCR candidate lines (see `run_core_benchmark.py`). Round-1 document-level GLiNER F1 (0.421 / 0.425) used the standalone extraction script on full joined OCR — **not identical protocol**, but same model and schema.

**Product gate (0.98 cal/confirm):** all DSRE heads → `product_approved: false`, gated test F1 = 0.

## Precision–coverage

Generated for **cosine** and **relational** on both datasets:

- `results/sroie/pc_cosine.csv`, `pc_relational.csv` (+ PNG)
- `results/cord/pc_cosine.csv`, `pc_relational.csv` (+ PNG)

## Latency & RSS (4 threads, CPU-only)

| Metric | SROIE | CORD |
| --- | ---: | ---: |
| GLiNER2 **per document** median / p95 (ms), batch=1 | 2464 / 3490 | 1835 / 2960 |
| DSRE relational **per episode** median / p95 (ms) | 1.29 / 1.44 | 3.62 / 3.83 |

- **Peak RSS (core run):** ~**2959 MiB** end (~63 MiB start)
- **Total wall:** ~**3256 s** (~54 min) for full core benchmark
- **GLiNER load:** ~3 s per dataset pass

## Run

```bash
export OMP_NUM_THREADS=4 PYTHONPATH=scripts:.:../../apps/worker/src
cd research/extraction_baseline/dsre
python3 scripts/build_npz.py --dataset sroie --out data/sroie.npz
python3 scripts/build_npz.py --dataset cord --out data/cord.npz
python3 scripts/run_core_benchmark.py
```

## Recommendation

On measured core run, **DSRE relational does not beat GLiNER2** (even under NPZ-aligned GLiNER eval). DSRE is much faster per episode but **cannot match field F1**; GLiNER is **~1000× slower per document** on CPU at batch 1. **Do not replace GLiNER2 with DSRE alone**; optional rerank **not run / not recommended**.

Integration hooks: unchanged from round-1 `research/extraction_baseline/REPORT.md`.
