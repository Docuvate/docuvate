# ML pipeline v0.1.0 research

Consolidated architecture and benchmark report: **`REPORT.md`**.

Prior field baselines (PR #90): `../extraction_baseline/REPORT.md` and `../extraction_baseline/dsre/REPORT.md`.

## Quick commands

```bash
pip install -r ../extraction_baseline/requirements.txt
export OMP_NUM_THREADS=4 MKL_NUM_THREADS=4 DOCUVATE_ENCODER_INTRA_OP_THREADS=4
export PYTHONPATH=apps/worker/src:research/extraction_baseline/scripts:research/ml_pipeline_v010/lib

# Canonical GLiNER2-base eval (original OCR, document-level F1)
python3 research/ml_pipeline_v010/scripts/run_unified_field_benchmark.py

# Explain earlier DSRE vs extraction_baseline GLiNER discrepancies
python3 research/ml_pipeline_v010/scripts/reconcile_gliner_protocols.py

# Optional GLiNER2.5 CPU probe (subset; see REPORT for API caveats)
python3 research/ml_pipeline_v010/scripts/probe_gliner25.py --max-docs 25

# Read-only Docuvate API smoke (credentials via env)
export DOCUVATE_API_URL=https://… DOCUVATE_API_TOKEN=…
python3 research/ml_pipeline_v010/scripts/bench_docuvate_api.py
```

Measured JSON artifacts: `results/` (committed summaries only; weights stay under `../extraction_baseline/.cache/`).
