# Closed-form ML research (Docuvate CE)

CPU-only feasibility experiments for pure-ML document tasks (no LLM training, no backprop in research heads).

## Interfaces (plug into CE)

| Interface | Implementations in this tree |
|-----------|------------------------------|
| `Classifier` | `RidgeE5Classifier`, `DeepStackE5Classifier`, `NestAdapterClassifier` |
| `KVExtractor` | `RegexKVExtractor` (+ shipped layout head evaluated via `eval/layout_kv_roles`) |
| `Retriever` | `HybridE5Bm25Retriever`, `KernelRerankRetriever` |
| `Reader` | `TokenOverlapReader`, `RidgeSpanReader`, optional `XlmRobertaReader` |

See [PRIOR_WORK.md](./PRIOR_WORK.md) for shipped NEST/KITE/LUNA baselines and known dead ends.

## Run matrix

```bash
cd apps/worker
uv venv .venv && uv pip install -e ".[dev]"
uv pip install -e ../../research/closed_form_ml scikit-learn
.venv/bin/python -m closed_form_ml.experiments.run_matrix --seed 42
```

Output: `research/closed_form_ml/results/matrix.json`

## Paper

Typst source: `research/paper/closed_form_ml.typ` (compile with `typst compile` if installed).
