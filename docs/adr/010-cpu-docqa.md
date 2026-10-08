# ADR 010: CPU-first document Q&A (RAG) vs GPU vision chat

## Status

Accepted (2026-03-26)

## Context

Document chat on CPU-only hosts (default Docker Compose) was slow or unusable when routed through **Donut DocVQA** or **full-document LLM dumps**. Industry practice (and [paperless-ai](https://github.com/clusterzx/paperless-ai)) separates:

1. **Retrieval** — hybrid BM25 + dense embeddings, optional cross-encoder rerank; cheap on CPU.
2. **Generation** — external LLM (Ollama / OpenAI-compatible); CPU-viable only with **small quantized** models and **short context**.

Paperless-ai runs a **Python FastAPI RAG** service (`main.py`) for `/context` and keeps generation in Node via Ollama — the RAG layer does not run Donut-style VLM chat.

## Decision

### Product runtime

- **CPU-safe path (always on):** Worker `context` / hybrid RAG — fastembed ONNX + BM25, chunk + top-k over OCR text (see `context_qa.py`). Product UI uses provider id **`rag-ollama`**: same retrieval, generation via small Ollama. Plain `context` excerpt replies remain for dev/API.
- **Donut DocVQA:** Gated by worker **hardware report** — requires GPU (`cuda` / `mps` / `rocm`) and **≥ 4096 MB** VRAM (`HEAVY_VISION_MIN_VRAM_MB`). Never advertised as available on CPU, even if `[donut]` extra is installed.
- **Ollama:** Available when `OLLAMA_URL` is set. Models that likely need GPU (heuristic: ≥7B tags, 70B, Mixtral, etc.) are **disabled** unless worker reports **≥ 6144 MB** VRAM (`LARGE_LOCAL_LLM_MIN_VRAM_MB`).
- **API:** `GET /settings/hardware` proxies worker `GET /v1/settings/hardware`.

### Experiments

See `experiments/README.md` and `experiments/notebooks/track3_cpu_docqa.py` for reproducible latency comparisons (RAG top-k vs full-doc prompt; optional Ollama when present).

### Compose / GPU

Default `docker compose up` includes **`ollama`** (CPU) and a one-shot **`ollama-init`** that pulls `${OLLAMA_MODEL:-qwen2.5:3b}`. The API waits for `ollama-init`, sets `DOCUMENT_CHAT_PROVIDER=rag-ollama`, and exposes document chat when `WORKER_URL`, `OLLAMA_URL`, and a CPU-safe model pass the hardware gate (`available !== false` on provider `rag-ollama`).

GPU services need [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) and device reservation in Compose. Without GPU, do not set `WORKER_OPTIONAL_EXTRAS=donut` expecting usable chat — use the bundled Ollama service or another small GGUF endpoint instead.

## Consequences

- Settings and chat provider lists reflect **hardware**, not only package install.
- Operators see i18n copy when chat is blocked by VRAM/GPU, not only OOM or missing extras.
- Donut remains optional extra; default image stays CPU-first.
