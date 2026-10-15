# Document Algebra Research (PoC)

Self-contained CPU research project: associative algebra representations `D_B` vs geometric, polynomial, kernel, MLP, tensor, and cross-bispectrum baselines on synthetic documents.

## Setup

```bash
cd research/doc_algebra
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

## Tests (algebra + property-based)

```bash
pytest -q
```

## Reproduce experiments

```bash
python -m experiments.run_all --seed 42 --n-docs 2000
```

Results land in `results/` (JSON/CSV + figures). See `research_report.md` for interpretation.

## Layout

- `src/algebra.py` — `D_B` product, fixed/learned `B_k`, geometry basis
- `src/tensor_algebra.py` — truncated tensor algebra to degree 3
- `src/features.py` — document field features, interactions, bispectrum hooks
- `src/data_generator.py` — synthetic invoices, letters, delivery notes, tables
- `src/baselines.py` — models A–H
- `src/train.py` / `src/evaluate.py` — training and metrics (P1–P4)
- `tests/` — unit + Hypothesis tests
- `experiments/run_all.py` — full benchmark harness

No product code dependencies; no real user data.
