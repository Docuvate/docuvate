# ADR 024: Cited document chat (CPU, library scope)

## Status

Accepted (2026-10-09)

## Context

Document chat was slow on CPU (thinking tokens, re-embedding per question) and answers were not reliably grounded. Operators target **k3s on Hetzner CAX (ARM64)** with **CPU-only** inference.

## Decision

1. **Persistent chunk index** on `document_text_chunks` with `page`, `char_start`, `char_end`, and ONNX embeddings at ingest (worker fastembed).
2. **Hybrid retrieval** in Postgres (FTS + pg_trgm + cosine on chunk embeddings, RRF), permission via document ownership.
3. **Reranker** in worker (`POST /v1/rag/retrieve`, fastembed `TextCrossEncoder`, ONNX int8, CPU) with **sigmoid-normalized** scores and `RAG_RERANKER_GATE_MIN` (default **0.21**, from `bench/rag_gate_calibrate.py` + `bench/rag-gate-calibration-scores.json`). Default model **`BAAI/bge-reranker-v2-m3-int8`** (Apache-2.0, multilingual). Permissive allowlist enforced in worker tests; NC-licensed models are rejected.
4. When the reranker is unavailable, the API **does not** invent passing scores; it applies **`RAG_FUSION_GATE_MIN`** (default **0.02**) on RRF fusion or abstains.
5. **Small Ollama model** with `think: false`, JSON claims, server-side quote verification; citations in `chat_message_citations` with **body-accurate** `quote` and char offsets.
6. **Thread scope `library`** for chat across all documents (replaces `corpus` in DB check). Library threads **do not** populate `chat_thread_documents`; retrieval uses all documents owned by the user at question time.
7. **Profiles** via `DOCUVATE_AI_PROFILE` (`off`, `cpu-small`, `cpu-medium`, `gpu`).
8. **Images** published `linux/amd64` and `linux/arm64`; worker uses ARM-capable wheels (Paddle, fastembed ONNX).
9. **Generation UX:** cited `rag-ollama` streams Ollama JSON tokens during the **generating** phase (early TTFT), then **verifying** for quote checks before citations are stored.

## Consequences

- ADR 010 remains for retrieval philosophy; generation path is superseded for `rag-ollama`.
- End-to-end latency (TTFT + total, multi-doc + abstention) is measured with `bench/cited_chat_eval.py` (`DOCUVATE_E2E=1` against compose).
- Worker `/v1/health/ready` and document-chat provider listing report reranker load failures.
