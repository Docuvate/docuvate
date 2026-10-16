# Extraction baseline (research)

See **[REPORT.md](./REPORT.md)** for architecture notes, model pins, and measured CORD/SROIE benchmarks.

Quick start:

```bash
pip install -r requirements.txt
export OMP_NUM_THREADS=4 PYTHONPATH=../../apps/worker/src:./scripts
cd scripts && python3 run_benchmark.py --max-docs 0
```

Model weights download to `.cache/` (gitignored).
