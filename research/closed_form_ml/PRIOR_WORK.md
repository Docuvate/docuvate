# Prior Docuvate ML components (repo baseline)

This research round builds on shipped CE components. **E1–E33 experiment ledgers are not present in this repository** (no `experiments/` tree on `main`); avoid re-running ideas already rejected in product code comments and gates below.

## Shipped closed-form / no-backprop heads

| Name | Location | Role |
|------|----------|------|
| **NEST** | `apps/worker/domain/embedding_density/` | Per-tenant NIW + Student-t label density on **document mean e5 vectors**; kernel corrections (closed-form Gram inverse). |
| **Layout KV head** | `eval/layout_kv_roles/` | Multiclass **logistic regression** (LBFGS) on frozen e5 + layout features — trained only on CORD + synthetic; FUNSD/XFUND eval-only. |
| **Value types** | `apps/worker/infrastructure/ml/value_types/` | Char-ngram **closed-form** log-likelihood classifier. |
| **LUNA / TACO** | `domain/cpu_pipeline/` | Fixed geometry / prediction-error heuristics (no learned weights in CE). |
| **KITE** | `kite_index_stage.py` | Metadata chunk index (not a classifier). |
| **FAKTUM** | API feature flag | Structured fact index + DSL — out of scope for this CPU pure-ML round. |

## Known failure modes (do not repeat)

1. **Second encoder pass on upload** — rejected by R1 central representation; all experiments must reuse one e5 encode per document/unit.
2. **Training eval-only corpora into shipped weights** — FUNSD/XFUND/DocVQA forbidden for training artifacts (see `eval/layout_kv_roles/README.md`).
3. **Heavy GPU transformers in CE path** — xlm-roberta reader is optional; default extractive fallback is token overlap.
4. **JSONB arrays of label IDs for SQL filters** — 3NF rule; prototypes live in normalized tables / NIW state.
5. **Un-calibrated open-set thresholds** — NEST uses temperature + τ; raw softmax max is not enough for rejection.
6. **Deep ELM with huge hidden width on laptop** — exceeds 8 GB when combined with e5 batch embed; cap random features and use Nyström for kernel layers.

## Baselines for this round

- **CE pipeline**: NEST + layout KV logistic + hybrid BM25/e5 retrieval + optional xlm-roberta reader.
- **Fine-tune**: xlm-roberta-base SQuAD2 (reader only; not re-trained here).
- **Small LLM**: qwen2.5:3b / qwen3-4b Q4 — zero-shot slot in harness when `OLLAMA_HOST` is set; skipped otherwise.
