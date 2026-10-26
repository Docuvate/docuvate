# Docuvate Worker

FastAPI service for document extraction and **CPU/ARM embedding** (no GPU required).

## Extraction (default)

1. **Born-digital PDFs** — `pdfplumber` reads the text layer and word boxes (no OCR). Most e-invoices skip OCR entirely.
2. **Office / text formats** — `python-docx`, `openpyxl`, `python-pptx`, `odfpy`, plus CSV/RTF/HTML/Markdown/EML/MSG parsers (no OCR). Older `.doc`/`.xls`/`.ppt` binaries use LibreOffice headless → PDF text layer. Spreadsheets emit layout IR tables.
3. **PDF preview** — LibreOffice `--headless --convert-to pdf` for non-PDF uploads (stored separately; original retained).
4. **Scans / image-only PDFs** — **PaddleOCR** PP-OCRv4 mobile with `PADDLE_OCR_LANG=german` (Paddle maps `german`/`de` to the **latin** multilingual model — tuned for DE Belege, still reads English on receipts).
3. **Tesseract** — optional last resort only: `EXTRACTOR_ENGINE=tesseract` and `uv pip install -e ".[tesseract]"` plus system `tesseract-ocr` (not in default Docker image).

**Why not Docling by default?** Docling pulls PyTorch and large layout models (~GB+), which bloats the Mac/CPU compose image. Docling remains a documented follow-up (`docs/ai-models.md`).

The default Docker image **pre-downloads** Paddle det/rec weights at build time (`prewarm_paddle_models`). Cold Arena/compare on a fresh dev install may still download into `~/.paddleocr` until prewarm completes.

**Memory / production:** Full extraction (PaddleOCR, ONNX layout, embedding-density) must run in a **child process** (`DOCUVATE_EXTRACT_SUBPROCESS=1`, default). In-process extract (`DOCUVATE_EXTRACT_SUBPROCESS=0`) is only allowed when `DOCUVATE_ALLOW_IN_PROCESS_EXTRACT=1` (local debugging). Running `uvicorn` on the host for lab batches will leak native heap and OOM the machine — use `docker compose … lab` with a container `mem_limit` instead.

**Throughput:** With `DOCUVATE_EXTRACT_POOL=1` (default in the worker image), warm child processes keep OCR/ONNX loaded between jobs (`DOCUVATE_EXTRACT_KEEP_MODELS=1` in the pool). Parallel in-flight extracts are capped by `DOCUVATE_EXTRACT_CONCURRENCY` / `DOCUVATE_EXTRACT_POOL_SIZE` (default derived from cgroup memory and CPU, typically 2–4 on a 2 GiB worker) and coordinated with cgroup admission (`ExtractResourceBusy` → retry). The API BullMQ consumer uses `DOCUMENT_EXTRACTION_CONCURRENCY` with the same default heuristic.

**CPU vs GPU images:** default Compose and Kubernetes manifests use the **CPU** image (`docuvate-worker`, multi-arch). For CUDA + Donut, see [DOCKER-IMAGES.md](./DOCKER-IMAGES.md) (`docker-compose.worker-gpu.yml` or Helm/Kustomize GPU component).

**Image size (office ingest delta):** adding `libreoffice-{writer,calc,impress}-nogui` and Python office libraries increases the CPU image by roughly **280–320 MB** compressed versus the pre-office baseline (measure locally with `docker image ls` before/after).

| Env                    | Default    | Description                                                                   |
| ---------------------- | ---------- | ----------------------------------------------------------------------------- |
| `EXTRACTOR_ENGINE`     | `pipeline` | `pipeline` (native PDF + Paddle), `paddle`, `docling` (extra), or `tesseract` |
| `PDF_NATIVE_MIN_CHARS` | `80`       | Min extracted chars to treat PDF as born-digital                              |
| `PADDLE_OCR_LANG`      | `german`   | PaddleOCR lang (`german`, `de`, or `latin`; default Belege-first)             |

## Embeddings

- Model: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` (ONNX via [fastembed](https://github.com/qdrant/fastembed))
- Runs on **Apple Silicon** and **amd64** using ONNX Runtime CPU execution providers.
- First `/embed` call **downloads** the model into the fastembed cache (typically under `~/.cache/fastembed`).

### Endpoints

| Method | Path       | Description                                                |
| ------ | ---------- | ---------------------------------------------------------- |
| POST   | `/extract` | Text + heuristic fields + layout blocks                    |
| POST   | `/embed`   | Batch text → L2-normalized vectors (passage prefix for E5) |

Both require header `X-Worker-Secret` (default `worker-shared-secret`).

## Local dev

```bash
cd apps/worker
uv pip install -e ".[dev]"
uvicorn docuvate_worker.main:app --reload --port 8000
```

Poppler (`pdftoppm`) is required for scan PDF OCR (`brew install poppler` on Mac).

## Donut DocVQA (optional chat)

Install the extra: `uv pip install -e ".[donut]"`. Device selection (first match wins unless overridden):

| Env                      | Default | Description                        |
| ------------------------ | ------- | ---------------------------------- |
| `DONUT_INFERENCE_DEVICE` | `auto`  | `auto`, `cuda`, `mps`, or `cpu`    |
| `TORCH_INFERENCE_DEVICE` | —       | Alias for `DONUT_INFERENCE_DEVICE` |

With `auto`, the worker uses **CUDA → MPS → CPU** for inference env overrides. **Settings/UI** only enable Donut when `GET /v1/settings/hardware` reports a GPU with ≥ 4096 MB VRAM — CPU-only hosts should use Ollama + small GGUF or dev `context` RAG (see `docs/adr/010-cpu-docqa.md`).

**Smoke on Mac arm64** (after `uv pip install -e ".[donut]"`):

```bash
cd apps/worker
python -c "from docuvate_worker.infrastructure.chat.donut_vqa import donut_inference_device; print('device', donut_inference_device())"
# expect: device mps

uvicorn docuvate_worker.main:app --port 8000
# First Donut question downloads ~800MB model; watch logs for: Donut inference device: mps
```

Force CPU (matches Linux CI): `DONUT_INFERENCE_DEVICE=cpu uvicorn …`

## Test extraction

```bash
curl -s -X POST http://localhost:8000/extract \
  -H 'Content-Type: application/json' \
  -H 'X-Worker-Secret: worker-shared-secret' \
  -d '{"mime_type":"application/pdf","content_base64":"'$(base64 -w0 sample.pdf)'"}' | jq '.text,.blocks|length'
```

Re-upload a PDF in the UI and open **Textblöcke** on the document detail page to verify overlay boxes.
