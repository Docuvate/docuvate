# Layout key/value role head (commercial training)

Trains the linear layout key/value role + linking head shipped in the worker image.

## Training data (commercially clean only)

- **CORD** (CC-BY-4.0) — optional download via Hugging Face when `CORD_DATA_DIR` is set
- **Synthetic forms** — bundled fixtures under `eval/layout_kv_roles/fixtures/`
- **AcroForm PDFs** — optional directory via `ACROFORM_PDF_DIR` (caller must ensure license)

**Never use FUNSD or XFUND for training.** Those corpora are reserved for offline evaluation (`eval_offline.py`).

## Reproduce the artifact

```bash
cd apps/worker
uv venv .venv && uv pip install -e ".[dev]"
uv pip install scikit-learn datasets
../../.venv/bin/python ../../eval/layout_kv_roles/train.py \
  --seed 42 \
  --output src/docuvate_worker/infrastructure/ml/artifacts/layout-kv-role-head.v1.json
bash ../../scripts/ci/update-third-party-models-manifest.sh
```

## Offline evaluation (not shipped weights)

```bash
python eval/layout_kv_roles/eval_offline.py --max-docs 50
```

Requires optional Hugging Face datasets and local FUNSD / XFUND-de splits; skipped in PR CI.
