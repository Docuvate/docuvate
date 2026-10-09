# AI models and ports

Docuvate keeps model choices behind **ports** so CPU-first self-hosting stays the default.

| Capability | Port / adapter | Default model or backend | Notes |
| --- | --- | --- | --- |
| PDF text (born-digital) | Worker `PipelineExtractor` → `pdfplumber` | No ML | Text layer + word boxes normalized 0–1 in `ExtractionBlock` |
| OCR and layout blocks (scans) | Worker `PipelineExtractor` → PaddleOCR | PP-OCRv4 mobile (`german` → latin multilingual) | DE Belege-first; Latin script covers German + English on receipts |
| Structured fields (heuristic) | Worker extract pipeline | Regex on extracted text | amount, date, vendor line |
| Document embeddings | `EmbeddingPort` → worker `/embed` | `paraphrase-multilingual-MiniLM-L12-v2` (fastembed ONNX) | Stored in `document_embeddings`; tag centroids for suggest |
| Tag suggestions (semantic) | `ApplyEmbeddingSuggestionsUseCase` | Same e5-small vectors | Cosine vs tag centroids and labeled docs |
| Label vocabulary (structure) | `GET /labels/recommendations` | Heuristics on extraction + centroid/name similarity | New labels, merge/rename hints; dismiss/accept; user `label_recommendation_blocklist` |
| Label map (structure) | `GET /labels/map` | PCA 3D on stored `document_embeddings` + tag centroids; web renders convex hulls / spheres per label | CPU-only projection in API |
| Tag / correspondent matching (rules) | `ApplyLabelMatchingUseCase` | User-defined patterns | Algorithms: any, all, exact, regex |
| Duplicate similarity | `ApplyDuplicateDetectionUseCase` | SHA-256 hash + embedding cosine + metadata gates | Hash = identical bytes; embedding default threshold 0.88 (`DUPLICATE_EMBEDDING_THRESHOLD`); rejects embedding pairs with conflicting reporting years or large page-count gaps (`DUPLICATE_PAGE_COUNT_MIN_DIFF`, default 3) unless similarity ≥ `DUPLICATE_PAGE_COUNT_GATE_MAX_SIMILARITY` (default 0.95) |
| Document chat | `DocumentChatPort` → provider router | **UI:** `rag-ollama` (hybrid RAG + small Ollama) or Donut (GPU) | **Text excerpt** (`context`) and raw **Ollama** full-doc are dev/API-only, not shown in Settings |
| Optional OCR fallback | `EXTRACTOR_ENGINE=tesseract` | Tesseract `deu+eng` | Not in default compose image; install `[tesseract]` extra |
| Future receipt OCR | `DonutStub` registry hook | Donut (phase 2) | Not enabled in MVP |
| Layout PDF (optional) | Worker `docling` engine | Docling | PyTorch + models — optional extra `[docling]`, listed in Settings/Arena when absent |

## Why PaddleOCR instead of Docling (for now)

Docling gives strong layout semantics but depends on **PyTorch** and multi-hundred-MB models, which makes the default worker image heavy on Mac/ARM CPU compose. **PaddleOCR PP-OCRv4 mobile** is the single shipped default for scans; Docling can be added later as an optional engine behind the same `ExtractorEngine` port.

## Per-user engine (Settings / Arena)

- `user_preferences.preferred_extractor_engine` (default `pipeline`) steuert Upload-Extraktion via API → Worker `engine` override.
- **Arena** speichert `extraction_arena_ratings` und optional `arena_winner_engine`; Toggle „Arena-Gewinner als Standard“ in `/settings`.

## Environment

- `WORKER_URL`, `WORKER_SECRET`: API → worker extract/embed
- `EXTRACTOR_ENGINE`: globaler Worker-Fallback (`pipeline` default, oder `tesseract` mit `[tesseract]` extra)
- `PDF_NATIVE_MIN_CHARS`: threshold for skipping OCR on PDFs (default `80`)
- `PADDLE_OCR_LANG`: PaddleOCR language (default `german`; maps to PP-OCRv4 `latin` rec — no separate `german+en` pack)
- `DOCUMENT_CHAT_PROVIDER`: `rag-ollama` (default in Compose when `WORKER_URL` + `OLLAMA_URL`), `context`, `donut-ml`, `ollama`, `mock`, `off`
- `DOCUMENT_CHAT_MODE`: alternate name for provider (`mock` / `ollama` / `off`)
- User override: `user_preferences.preferred_chat_provider` (Settings UI)
- `OLLAMA_URL`, `OLLAMA_MODEL`: RAG+Ollama product path (`rag-ollama`). Compose defaults: `http://ollama:11434`, **`qwen2.5:1.5b`** (CPU, auch ARM64/k3s). Dev-only full-doc `ollama` / `mock` require `NODE_ENV=development` or `DOCUMENT_CHAT_DEV_PROVIDERS=true`.
- `DOCUVATE_AI_PROFILE`: `off` (retrieval only), `cpu-small` (1.5B, default), `cpu-medium` (3B), `gpu` (hardware gate).
- `OLLAMA_MEM_LIMIT`: Docker `mem_limit` for the Ollama service (default **`3g`**). **`qwen3:4b` needs ≥ `5g`** loaded (~3.5 GB model + overhead); otherwise OOM/restart.
- `OLLAMA_CHAT_TIMEOUT_MS` (sync `/chat`), `OLLAMA_CHAT_IDLE_TIMEOUT_MS` (streaming idle), `OLLAMA_NUM_CTX`, `OLLAMA_NUM_PREDICT`, `OLLAMA_KEEP_ALIVE`, `WORKER_RAG_CONTEXT_TIMEOUT_MS`: CPU tuning (Compose defaults: 180s / 120s idle / **2048 ctx / 256 predict** / 30m keep-alive / 120s RAG). Set `OLLAMA_NUM_THREADS` / `OMP_NUM_THREADS` on ARM64 nodes (see `bench/cited_chat_eval.py` output).
- Docker Desktop: allocate **10–12 GB** RAM total for worker + Ollama + API; see `OLLAMA_MEM_LIMIT` in `docker-compose.yml`.
- **Donut DocVQA** (optional): large worker image (transformers + torch). **Product UI gates Donut** unless the worker reports a GPU with sufficient VRAM (`GET /settings/hardware`). CPU inference is not offered for chat even if `[donut]` is installed.
  - **Docker Compose:** set `WORKER_OPTIONAL_EXTRAS=donut`, **rebuild** worker, and reserve a GPU (see `docker-compose.yml` comments). Without Donut or RAG+Ollama, the document **Chat tab stays visible but disabled** (overlay + Settings hint).
  - **Local dev (Mac etc.):** `uv sync --extra donut` in `apps/worker` (handled on the host; not required in default compose).
  - `DONUT_INFERENCE_DEVICE` / `TORCH_INFERENCE_DEVICE`: `auto` (default), `cuda`, `mps`, or `cpu`. On Apple Silicon, `auto` selects **MPS** when PyTorch reports it available. `PYTORCH_ENABLE_MPS_FALLBACK=1` is set automatically when MPS is used (helps Donut ops missing native MPS kernels).
- **CPU DocQA pattern:** hybrid retrieval over OCR text + optional **small** Ollama model — see [ADR 010](./adr/010-cpu-docqa.md) and `experiments/README.md` (paperless-ai-style split).
- Embeddings and OCR run on CPU; no GPU required for MVP compose stack

## CPU document-chat model eval (Track 3)

Reproducible harness: `experiments/scripts/eval_cpu_docqa_models.py` — **20 German questions** on OCR fixtures (Rechnung, Mietvertrag, Bilanz, SEPA-Mandat), BM25 top-k chunks (same shape as worker RAG), system prompt aligned with `buildDocumentRagSystemPrompt` (including `/no_think` for Qwen3). Pulls missing tags, skips models that exceed `OLLAMA_MEM_LIMIT`, unloads models between runs (`keep_alive: 0`), writes JSON + Markdown to `experiments/results/`.

```bash
docker compose up -d ollama ollama-init
export OLLAMA_HOST=http://127.0.0.1:11434
export OLLAMA_MEM_LIMIT=3g   # Compose default; use 5g+ to eval qwen3:4b

cd apps/worker && uv run python ../../experiments/scripts/eval_cpu_docqa_models.py
# → experiments/results/docqa_eval_<timestamp>.json|.md
```

Ollama tags verified on [ollama.com/library](https://ollama.com/library): `qwen2.5:3b`, `qwen3:4b`, `gemma3:4b`, `phi4-mini:3.8b-q4_K_M`, `llama3.2:3b`, `qwen2.5:7b`.

| Modell | Korrektheit | Abstain (keine Halluz.) | TTFT (s, CPU) | tok/s | Anmerkung |
| --- | ---: | ---: | ---: | ---: | --- |
| `qwen2.5:3b` | noch nicht gemessen | noch nicht gemessen | noch nicht gemessen | noch nicht gemessen | **Compose-Default** (3g Limit) |
| `qwen3:4b` | noch nicht gemessen | noch nicht gemessen | noch nicht gemessen | noch nicht gemessen | Optional bei **OLLAMA_MEM_LIMIT ≥ 5g** |
| `qwen2.5:7b` | noch nicht gemessen | noch nicht gemessen | noch nicht gemessen | noch nicht gemessen | Qualitätsstufe |
| `gemma3:4b` | noch nicht gemessen | noch nicht gemessen | noch nicht gemessen | noch nicht gemessen | Kandidat |
| `phi4-mini:3.8b-q4_K_M` | noch nicht gemessen | noch nicht gemessen | noch nicht gemessen | noch nicht gemessen | Kandidat |
| `llama3.2:3b` | noch nicht gemessen | noch nicht gemessen | noch nicht gemessen | noch nicht gemessen | Kandidat |

**Compose-Default `qwen2.5:3b`:** passt zu **3g** Ollama-Limit auf typischen Docker-Desktop-Setups (~8 GB gesamt). **`qwen3:4b`** ist eine **optionale** Upgrade-Stufe (Qwen3, Deutsch, 4B Q4), sobald **`OLLAMA_MEM_LIMIT` ≥ 5g** — vorläufig bis Eval-Zahlen vorliegen. 4B–8B Q4 gilt in `ollamaModelLikelyNeedsGpu` als CPU-tauglich (GPU-Gate ab ~9B).

## Background retrain and model registry

See [`docs/mlops-retrain-and-registry.md`](./mlops-retrain-and-registry.md) for versioned training data, MLflow recommendation, canary promotion, and rollback. Default inference is unchanged until `MLOPS_REGISTRY_ENABLED=true`.

## Follow-ups

- Docling engine optional extra: paragraph/table blocks and WYSIWYG editing fidelity
- Donut for receipt-specific fields
- Dedicated duplicate review merge (metadata copy) beyond dismiss + manual delete
- pgvector index when embedding corpus grows
