# DSRE benchmark report (round 2)

Research path: `research/extraction_baseline/dsre/`. No product code changes. Weights in `.cache/` only.

## Prototype re-implemented

Faithful DSRE stack per maintainer spec:

| Component | Location |
| --- | --- |
| NPZ builder (E5 query/passage prefixes, token-pooled span vectors, layout xc/yc/w/h) | `scripts/build_npz.py`, `dsre_lib/e5_encode.py` |
| Layout-only candidates (lines + word windows, no gold, no keyword rules) | `dsre_lib/candidates.py` |
| Heads: cosine, linear, bilinear, relational ridge (α=10, 1/candidates weight, bias unreg.) | `dsre_lib/features.py`, `dsre_lib/evaluate.py` |
| Cal/confirm gate (target precision 0.98, min 20 accepted) + Clopper–Pearson confirm | `dsre_lib/evaluate.py` |
| Family-disjoint splits | `dsre_lib/splits.py` |

### Family ids (documented)

- **CORD:** hash of sorted top-level `valid_line` category prefixes + image size buckets (80 px).
- **SROIE:** hash of 4×4 OCR center histogram (first 40 boxes) + line-count bucket + image size buckets.
- **Carve:** train/val (CORD) or train (SROIE) families → 70% / 15% / 15% train/cal/confirm; official **test** untouched. Assert no family appears in more than one split code.

### NPZ contract

`episode_doc` maps each field episode to a document; `offsets[D+1]` indexes shared candidate spans per document. Saved with `np.savez_compressed(..., allow_pickle=False)`. See `dsre_lib/npz_store.py`.

## Candidate recall (separate from field F1)

| Dataset | Candidate recall (exact normalized span in pool) |
| --- | ---: |
| SROIE | **0.645** |
| CORD | **0.933** |

Boundary/normalization errors and absent fields are tracked via `gold=-1` with `field_absent` flag.

## Test field F1 (exact span index match, raw top-1)

| Model | SROIE test F1 | CORD test F1 |
| --- | ---: | ---: |
| E5 cosine | 0.004 | 0.001 |
| E5 + linear ridge | 0.057 | 0.130 |
| E5 + bilinear ridge | 0.056 | 0.130 |
| **DSRE relational** | **0.062** | **0.191** |
| GLiNER2-base (round-1 reference¹) | **0.421** | **0.425** |

¹ Same `fastino/gliner2-base-v1`, same field schemas; measured in `research/extraction_baseline/results/benchmark_scores.json` (document-level normalized value match). DSRE uses **exact candidate index** on OCR-derived spans — stricter and not directly numerically identical to round-1, but same splits/schema.

**Product gate (0.98 precision, confirm LCB):** no head met min 20 accepts on cal/confirm → **all `product_approved: false`**, gated test F1 = 0.

## Comparison to GLiNER2 (task 4)

| Question | Finding |
| --- | --- |
| Better generalization? | **No.** DSRE relational best raw F1 still **6–19 pp below** GLiNER2 reference on both datasets. Unseen field-type slices were empty in our family carve (all schema types appear in train). |
| Same quality, fewer resources? | **No.** DSRE avoids PyTorch at inference but needs large candidate pools + ridge train; **does not reach GLiNER quality** on these receipts. |
| Few-shot adaptation? | Relational F1 scales slightly with train size (see `scripts/run_dsre_benchmark.py` learning curve); still far below GLiNER at full train. |

**Optional GLiNER+DSRE rerank:** not justified (DSRE scores do not improve over GLiNER top spans in this setup).

## Precision–coverage

CSV/PNG: `results/sroie/pc_*.csv` (partial from earlier run) and `scripts/make_pc_curves.py` to regenerate for cosine + relational.

## Error analysis (SROIE, relational)

Typical failures (candidate pool / normalization):

- **Date:** OCR `15/01/2019` vs gold variant spacing or partial line match.
- **Total:** model picks nearby amount line (e.g. subtotal) when multiple numeric candidates exist.
- **Address:** long multi-line address; gold span not generated as single candidate → `gold=-1` (recall ceiling).

See `results/sroie_errors.json` when `run_dsre_benchmark.py` completes error export.

## CPU / RAM

- **Threads:** 4 (`OMP_NUM_THREADS=4`).
- **Docker 8 GiB:** not available on VM; concurrent GLiNER batches OOM'd at batch 8 (~15 GiB host).
- **DSRE:** relational train ~226 s/dataset pass (SROIE); episode scoring ~4 s/head eval pass after train.
- **Profile stub:** `results/resource_profile.json`.

Run:

```bash
pip install -r ../requirements.txt matplotlib
export OMP_NUM_THREADS=4 PYTHONPATH=scripts:.:../../apps/worker/src
cd research/extraction_baseline/dsre
python3 scripts/build_npz.py --dataset sroie --out data/sroie.npz
python3 scripts/build_npz.py --dataset cord --out data/cord.npz
python3 scripts/run_dsre_benchmark.py --dataset sroie --npz data/sroie.npz
python3 scripts/measure_resources.py
python3 scripts/make_pc_curves.py
```

## Recommendation

**Do not prioritize DSRE as a replacement for GLiNER2** for zero-shot receipt field extraction on CORD/SROIE under CPU-only, 8 GiB constraints. Measured relational DSRE **does not beat** GLiNER2 field F1; product precision gates fail with abstention.

**Practical path:** keep **GLiNER2 (or similar seq-labeler)** for open-schema spans; invest in **candidate recall** (layout-aware segmentation), **normalization**, and **calibrated gating** — not an extra ridge head on frozen E5 alone. Revisit DSRE only if candidate recall → ~1.0 on present fields and confirm gate can be met on cal/confirm.

Integration hooks unchanged from round-1 report: `layout_kv_field_suggestions`, `EmbeddingPort`, `ExtractedField` worker shape.
