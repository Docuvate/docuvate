# Extraction baseline report (CORD / SROIE)

Research-only benchmark under `research/extraction_baseline/`. No product code changes. Model weights live in gitignored `.cache/` only.

## 1. Existing Docuvate architecture (embeddings, OCR / layout, labels, persistence, ports)

### 1.1 Embedding generation

| Layer | Path | Notes |
| --- | --- | --- |
| Worker encode | `apps/worker/src/docuvate_worker/infrastructure/onnx_e5_encoder.py` | ONNX Runtime CPU, `last_hidden_state` → mean pool → L2 norm |
| Worker API | `apps/worker/src/docuvate_worker/presentation/routes.py` → `POST /embed` | Body: `{ texts, input_type: "passage" \| "query" }`; header `X-Worker-Secret` |
| Passage prefix | `apps/worker/src/docuvate_worker/domain/representation/constants.py` | `passage: ` / `query: ` for E5 |
| Representation units | `apps/worker/src/docuvate_worker/domain/representation/encode.py` → `encode_units()` | Paragraph units → int8-quantized vectors + document mean/max |
| API adapter | `apps/api/src/modules/labels/infrastructure/http-embedding.adapter.ts` | `EmbeddingPort` → worker `/embed`, batch 32 |
| Domain port | `apps/api/src/shared/domain/ports.ts` | `EmbeddingPort`, `LabelEmbeddingRepository`, `DocumentEmbeddingReference` |

Legacy name `fastembed_model.py` still wraps ONNX (`embed_passages` / `embed_query`).

### 1.2 OCR / layout IR

| Component | Path |
| --- | --- |
| Layout IR types | `apps/worker/src/docuvate_worker/domain/layout_ir.py` — `LayoutIrDocument`, `LayoutIrPage`, `LayoutIrBlock` (word boxes), tables, lines, widgets; `LayoutIrCellRole` = `header` \| `label` \| `value` |
| Build / render | `apps/worker/src/docuvate_worker/infrastructure/layout/` (`build.py`, `render_html.py`, `render_typst*.py`) |
| Extraction blocks | `apps/worker/src/docuvate_worker/domain/models.py` — `ExtractionBlock`, `ExtractionResult` (text, fields, blocks, optional `layout_ir`, `document_representation`) |
| Worker extract | `POST /extract` in `routes.py` — OCR + heuristics + optional CPU pipeline artifacts |
| KV field head | `apps/worker/src/docuvate_worker/infrastructure/ml/layout_kv_roles/suggestions.py` — `layout_kv_field_suggestions(blocks, representation)` |

### 1.3 Labeling (TF-IDF + E5 + logistic regression, open-set)

| Piece | Path |
| --- | --- |
| Hybrid features | `apps/api/src/modules/labels/domain/label-hybrid-features.ts` |
| Train / predict | `apps/api/src/modules/labels/domain/label-hybrid-auto-match.ts` — `trainLabelHybridModel`, `predictLabelHybrid`, LOO gates, abstention via `confidenceThreshold` + per-class cosine gates |
| User model | `apps/api/src/modules/labels/domain/label-hybrid-training.ts` — `trainUserLabelHybridModel`, `evaluateLabelHybridLeaveOneOut` |
| Recommendations | `apps/api/src/modules/labels/domain/label-recommendation-scoring.ts` — hybrid assign, embedding-density, **`discoverOpenSetNewLabelClusters`** |
| Open-set discovery (PR #88) | `apps/api/src/modules/labels/domain/label-open-set-discovery.ts` — hybrid-space clustering, thresholds `OPEN_SET_MIN_*`, target precision 0.95 |
| HTTP | `apps/api/src/modules/labels/presentation/labels-overview.controller.ts` — `GET /v1/labels/recommendations`, map, accept/dismiss |

Label model is **unchanged** by this research branch.

### 1.4 Document persistence (PostgreSQL)

| Table | Purpose |
| --- | --- |
| `documents` | Core row; `extracted_text`, `extracted_fields` (JSONB legacy path) |
| `document_embeddings` | Legacy whole-document JSONB embedding (`model`, `embedding`) |
| `document_representation` / `document_representation_unit` | Central encoder id/revision, per-unit int8 vectors (`document-representation-up.sql`) |
| `document_field_values` | Normalized field index for search (3NF migration) |
| `document_tag_suggestions` | Label suggestions (`source`: rule \| embedding \| embedding_density, `confidence`) |
| `recognized_field_definitions` | User field catalog |
| `document_recognized_field_extraction_attempt` | Per-field extraction attempts / gating |
| `tenant_label_calibration` / `tenant_label_prototype` | Tenant label space calibration & prototypes |
| `embedding_density_*` | NIW density model state & corrections |

RLS policies tie rows to `app.tenant_id` (see `document-representation-up.sql`).

### 1.5 AI ports (API)

Defined in `apps/api/src/shared/domain/ports.ts`:

- `EmbeddingPort` — query/passage embeddings
- `LabelFieldExtractionPort` — `extractLabelFields` → worker `/extract/label-fields` (`http-label-field-extraction.adapter.ts`)
- `LabelEmbeddingRepository` — document embeddings for label map / hybrid training
- Chat / RAG ports in `modules/cited-chat/` (out of scope for field KV benchmark)

Worker ML routes (same file): `/ml/embedding-density/*`, `/rag/extractive-answer`, `/representation/from-text`.

---

## 2. E5 variant used in production

| Property | Value |
| --- | --- |
| Hugging Face id | `intfloat/multilingual-e5-small` |
| Weight revision (git pin) | `614241f622f53c4eeff9890bdc4f31cfecc418b3` |
| Stored `encoder_revision` | `614241f622f53c4eeff9890bdc4f31cfecc418b3-onnx-int8` |
| License | MIT |
| Dimensions / max length | 384 / 512 tokens (`constants.py`, `onnx_e5_encoder._MAX_TOKENS`) |
| Pooling | Mean over `last_hidden_state`, then L2 normalize (`onnx_e5_encoder.py`) |
| Quantization / runtime | **ONNX int8** `onnx/model_qint8_avx512_vnni.onnx` on x86_64; ARM fallback `model_O4.onnx` |
| Threads | `DOCUVATE_ENCODER_INTRA_OP_THREADS` / `OMP_NUM_THREADS` (default 4) |

### Token-level hidden states

The pinned ONNX graph exposes **`last_hidden_state`** with shape `[batch, sequence_length, 384]` (verified in `results/e5_onnx_probe.json`).

Reuse pattern (not used in production embed path today):

1. Tokenize with bundled `onnx/tokenizer.json`.
2. `session.run` → `last_hidden_state`.
3. Slice per token for span scoring; production code only mean-pools in `embed_texts_onnx`.

**Cost (this VM, 4 threads, one ~165-token passage):** ~12.7 ms forward for hidden states; ~11.2 ms full `embed_texts_onnx` (see probe JSON). Span baselines that embed many word contexts scale linearly with span count.

### E5 weight SHA-256 (cached copies)

See `results/model_manifest.json`. Primary ONNX file:

- `onnx/model_qint8_avx512_vnni.onnx` — `dd476dd0c2514e9b9be83aeb3853fac0763e0bdf4a71645407587d77c48a2d88` (118,346,824 bytes)

---

## 3. GLiNER2 model (commercial license)

| Property | Value |
| --- | --- |
| Model id | **`fastino/gliner2-base-v1`** |
| HF revision (commit) | `f9634218e53580c56edf0de97ca1a7d3f1c2354e` |
| License | **Apache-2.0** (model card + [GLiNER2 LICENSE](https://github.com/fastino-ai/GLiNER2/blob/main/LICENSE)) |
| Weight file | `model.safetensors` — SHA-256 **`845fc4bd93c525b86124c58ab4f56c9eacf8587953086b14c501fab25957c007`** (833,938,108 bytes) |
| Also hashed | `config.json`, `tokenizer.json` in `results/model_manifest.json` |

GLiNER2 qualifies as commercially usable (Apache-2.0). No FUNSD/XFUND/DocVQA weights are committed.

---

## 4. Datasets (official splits)

| Dataset | HF id | Revision | License | Splits used |
| --- | --- | --- | --- | --- |
| CORD | `naver-clova-ix/cord-v2` | `7f0115a4b758a71d6473b8d085751692da2fef98` | CC-BY-4.0 | **test: 100** (train 800, val 100 available) |
| SROIE 2019 | `rth/sroie-2019-v2` | `ede4bd3cd7e687bd5580d0e3f52cda1b4e9bac1c` | HF card: no SPDX; ICDAR 2019 Task 3 terms — see [RRC ch.13](https://rrc.cvc.uab.es/?ch=13) | **test: 347** (train 626) |

Ground truth:

- **CORD:** `ground_truth` JSON → `gt_parse` flattened to canonical keys (`total_price`, `item_name`, …).
- **SROIE:** `objects.entities` → `company`, `date`, `address`, `total`.

OCR text for benchmarks comes from dataset annotations (CORD `valid_line` words; SROIE `objects.text`), not live PaddleOCR — isolates extractors.

---

## 5. Benchmark methods & measured metrics

Metrics: micro precision / recall / F1 over canonical field keys, exact-match rate (all GT fields correct), per-document latency median/p95. **Abstention threshold 0.5** applies to `docuvate_layout_kv` and `e5_token_span` (confidence/cosine); GLiNER2 high-level API returns no scores (non-abstaining predictions counted at confidence 1.0).

Full JSON: `results/benchmark_scores.json` (measured on this run, not synthetic).

### CORD (test, n=100)

| Method | Precision | Recall | F1 | Exact-match docs | Latency median / p95 (ms) |
| --- | ---: | ---: | ---: | ---: | --- |
| GLiNER2 zero-shot | 0.441 | 0.411 | 0.425 | 1 / 100 | 70 / 98 |
| Docuvate `layout_kv_field_suggestions` | 0.006 | 0.001 | 0.002 | 0 | 20 / 50 |
| E5 token-span baseline | 0.062 | 0.101 | 0.077 | 0 | 47 / 97 |

### SROIE (test, n=347)

| Method | Precision | Recall | F1 | Exact-match docs | Latency median / p95 (ms) |
| --- | ---: | ---: | ---: | ---: | --- |
| GLiNER2 zero-shot | 0.487 | 0.371 | 0.421 | 0 | 138 / 228 |
| Docuvate layout KV | 0.000 | 0.000 | 0.000 | 0 | 96 / 221 |
| E5 token-span baseline | 0.051 | 0.051 | 0.051 | 0 | 169 / 312 |

**Interpretation (measured, not target):**

- GLiNER2 English schema (`company`, `date`, … / receipt field slugs) is the strongest zero-shot baseline on CPU but still far from production gating requirements.
- Shipped **layout KV head** (`layout-kv-role-head.v1.json`) is trained on CORD-like layout with synthetic forms; on zero-shot SROIE it emitted no accepted pairs above internal link/role thresholds → zero metrics.
- **E5 span baseline** (word context + query embedding, cosine abstain 0.5) is a cheap ablation but not competitive.

Precision at abstention: for τ=0.5, micro precision equals the table above for layout KV and E5 span (predictions below τ are dropped before matching). GLiNER2: no score API — abstention not applicable without lower-level logits.

---

## 6. CPU latency & memory (4 threads)

Environment: **4 vCPU** Intel Xeon (KVM), **no GPU**, `OMP_NUM_THREADS=4`. Docker was **not** available on this VM; memory cap not enforced via cgroup — host had ~15 GiB RAM.

| Probe | Result |
| --- | --- |
| GLiNER2 per doc (SROIE sample n=30) | median **149 ms**, p95 **358 ms** |
| E5 single passage embed | median **22 ms**, p95 **38 ms** |
| Peak RSS (benchmark process, GLiNER loaded) | **~2.2 GiB** (`results/latency_rss.json`) |

Use `./scripts/run_in_cgroup.sh` when Docker is present for `--cpus=4 --memory=8g` replication.

Hardware snippet: see `results/latency_rss.json` → `hardware`.

---

## 7. Executable commands

From repo root (install once):

```bash
pip install -r research/extraction_baseline/requirements.txt
export OMP_NUM_THREADS=4 MKL_NUM_THREADS=4 DOCUVATE_ENCODER_INTRA_OP_THREADS=4
export PYTHONPATH=apps/worker/src:research/extraction_baseline/scripts
cd research/extraction_baseline/scripts
python3 download_models.py          # SHA-256 manifest → ../results/model_manifest.json
python3 probe_e5_onnx.py            # token hidden-state probe
python3 run_benchmark.py --max-docs 0   # full CORD+SROIE test splits
python3 measure_latency.py          # RSS + latency sample
./run_in_cgroup.sh                  # optional Docker 4 CPU / 8 GiB
```

---

## 8. Integration points (reuse, no new architecture)

| Goal | Reuse |
| --- | --- |
| Text + boxes → representation | `encode_units()` + worker `/representation/from-text` or CPU pipeline blocks |
| KV pair suggestions | `layout_kv_field_suggestions()` — needs `ExtractionBlock[]` + `DocumentRepresentation` |
| Persist fields | API document repository → `document_field_values` writer (`document-field-value-index.ts`) |
| Label gating | Keep `predictLabelHybrid` + open-set discovery; field extractors should **abstain** low confidence (`layout_kv` link/role mins in artifact JSON) |
| External NER | New worker route could wrap GLiNER2 behind same `ExtractedField` shape as `/extract/heuristic-field-suggestions` — **out of scope** (research only) |
| Embeddings | Continue `EmbeddingPort` / ONNX E5; span experiments can call `_feed_batch` internally only in worker |

### Functions / files to wire a future extractor

- `apps/worker/src/docuvate_worker/infrastructure/ml/layout_kv_roles/suggestions.py`
- `apps/worker/src/docuvate_worker/application/cpu_document_pipeline/stages/fields_stage.py`
- `apps/api/src/modules/labels/infrastructure/http-label-field-extraction.adapter.ts`
- `apps/api/src/shared/domain/ports.ts` — `LabelFieldExtractionPort`, `EmbeddingPort`

---

## 9. Blockers / caveats

- **SROIE license** is not SPDX on HF; confirm ICDAR/RRC terms for commercial use.
- **GLiNER2** requires PyTorch (~CPU wheel); not in default worker image today.
- **Layout KV** on SROIE failed open at default thresholds — integration would need calibration per locale/schema, not regex keyword rules.
- **Heuristic regex fields** (`heuristic_fields_regex.py`) exist in product but were **excluded** from this benchmark per task constraints.

---

*Generated as part of branch `cursor/extraction-baseline-5a49`. Raw artifacts: `results/benchmark_scores.json`, `results/e5_onnx_probe.json`, `results/model_manifest.json`, `results/latency_rss.json`.*
