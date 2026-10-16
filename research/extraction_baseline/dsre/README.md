# DSRE extraction benchmark

Semantic Relational Extractor ablation: frozen **multilingual-e5-small** span vectors + layout features + ridge heads vs **GLiNER2-base**.

See **[REPORT.md](./REPORT.md)** for measured results and recommendation.

```bash
export OMP_NUM_THREADS=4 PYTHONPATH=scripts:.:../../apps/worker/src
python3 scripts/build_npz.py --dataset sroie --out data/sroie.npz
python3 scripts/run_core_benchmark.py   # 5 models × CORD/SROIE + PC + GLiNER batch=1 latency
```

NPZ files stay under `data/` (gitignored).
