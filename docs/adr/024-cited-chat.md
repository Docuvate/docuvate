# ADR 024: Cited document chat (CPU, library scope)

## Status

Accepted (2026-10-09)

## Context

Document chat was slow on CPU (thinking tokens, re-embedding per question) and answers were not reliably grounded. Operators target **k3s on Hetzner CAX (ARM64)** with **CPU-only** inference.

## Decision

1. **Persistent chunk index** on `document_text_chunks` with `page`, `char_start`, `char_end`, and ONNX embeddings at ingest (worker fastembed).
2. **Hybrid retrieval** in Postgres (FTS + pg_trgm + cosine on chunk embeddings, RRF), permission via document ownership.
3. **Reranker** in worker (`POST /v1/rag/retrieve`, fastembed cross-encoder, ONNX, CPU) with score gate before LLM.
4. **Small Ollama model** with `think: false`, JSON claims, server-side quote verification; citations in `chat_message_citations`.
5. **Thread scope `library`** for chat across all documents (replaces `corpus` in DB check).
6. **Profiles** via `DOCUVATE_AI_PROFILE` (`off`, `cpu-small`, `cpu-medium`, `gpu`).
7. **Images** published `linux/amd64` and `linux/arm64`; worker uses ARM-capable wheels (Paddle, fastembed ONNX).

## Consequences

- ADR 010 remains for retrieval philosophy; generation path is superseded for `rag-ollama`.
- Median end-to-end latency should be measured with `bench/cited_chat_eval.py` on target hardware (reports `machine`, thread env vars).
