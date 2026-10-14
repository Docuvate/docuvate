# ML feature flags (Community Edition 0.1.0 beta)

Docuvate Community Edition exposes optional machine-learning features as **per-tenant feature flags**. Each flag has an installation-wide default (environment variables on the API container) and optional **per-tenant overrides** stored in the database. Signed-in clients receive the resolved values from `GET /v1/remote-config`. Installation administrators can set overrides with `PATCH /v1/admin/users/{userId}/feature-flags`.

This document describes the ML flags shipped in **0.1.0 beta**, related environment variables, Docker Compose profiles, RAM guidance, and encoder re-indexing after an embedding upgrade.

See also [Self-hosting](./self-hosting.md) (Compose operations) and [AI models and ports](./ai-models.md) (models and chat providers).

## Flag reference

Remote-config keys use **camelCase** (for example `exactAnswers`). Database override rows use **snake_case** keys (for example `exact_answers`).

| Remote-config key | Default (0.1.0 beta) | `DOCUVATE_FEATURE_*` env var | What it enables |
| --- | --- | --- | --- |
| `exactAnswers` | off | `DOCUVATE_FEATURE_EXACT_ANSWERS` | Structured fact index on upload; document and library chat can answer typed lookups and aggregations (amounts, counts, dates) from indexed facts before falling back to retrieval. |
| `answerAbstention` | off | `DOCUVATE_FEATURE_ANSWER_ABSTENTION` | With `exactAnswers`, low-confidence fact matches **abstain** (for example “Not found in the documents.”) instead of falling through to embedding/RAG, reducing hallucinations on unknown entities. Match scoring uses a calibrated threshold (installation default **0.55**; per-tenant override in tenant exact-fact chat settings when configured). |
| `smartDuplicates` | off | `DOCUVATE_FEATURE_SMART_DUPLICATES` | Template-subtracted duplicate **hints** in addition to content-hash matching. Hints are UI-only; Docuvate does not auto-merge or delete documents. |
| `learnedValueTypes` | **on** | `DOCUVATE_FEATURE_LEARNED_VALUE_TYPES` | Learned value-type classification for extracted field candidates instead of hand-written regex heuristics. Set the env var to `false` to disable installation-wide. |
| `layoutKeyValueRoles` | off (**experimental**) | `DOCUVATE_FEATURE_LAYOUT_KEY_VALUE_ROLES` | Layout key/value role head on passage embeddings (key vs value linking on OCR boxes). Experimental; default stays off until you enable it per installation or tenant. |
| `localChatModel` | off | `DOCUVATE_FEATURE_LOCAL_CHAT_MODEL` | Open-ended LLM answers in cited document chat via a **local** Ollama model when the stack runs the optional **`chat-local`** Compose profile. Without this flag, chat still works on the cited extractive / retrieval path. |

Legacy non-ML flags (`layoutReconstructionCompare`, `sourceConnectors`, `experimentalResearchModels`) remain documented in [Self-hosting](./self-hosting.md).

### Enabling flags

1. **Installation default:** set the corresponding `DOCUVATE_FEATURE_*` variable to `true` (or `1` / `yes`) in `.env` and restart the API (Compose recreates the `api` service).
2. **Per tenant:** use the admin API override endpoint or future UI; overrides win over env defaults.
3. **Web app:** after sign-in, the UI reads resolved flags from remote config (no separate toggle for most ML flags in 0.1.0 beta).

`learnedValueTypes` is special: when the env var is **unset**, the installation default is **on**. Explicit `false`, `0`, or `no` turns it off.

### Flag interactions

- `answerAbstention` is meaningful only together with `exactAnswers`.
- `localChatModel` requires a reachable **`OLLAMA_URL`** (provided by the **`chat-local`** profile) and a pulled chat model (default **`qwen2.5:1.5b`**). Settings expose readiness hints (`documentChatLocalModelEnabled`, `documentChatLocalModelReady`).
- When `smartDuplicates` is on, embedding-based duplicate detection is skipped to avoid competing signals.

## Docker Compose profiles and RAM

### Default stack (no Ollama)

```bash
docker compose up -d
```

Runs API, worker, PostgreSQL, MinIO, Valkey, and supporting jobs. **Ollama is not started.** Document chat uses cited extractive answers and retrieval over OCR text; structured fact answers work when `exactAnswers` is enabled.

**Host RAM:** plan **≥ ~6 GiB** for Compose `mem_limit` totals plus the OS (matches `scripts/quickstart.sh` guidance for the CPU-only profile).

### Optional local chat (`chat-local`)

```bash
docker compose --profile chat-local -f docker-compose.yml -f docker-compose.chat-local.yml up -d
```

Adds Ollama and pulls **`qwen2.5:1.5b`** (Q4). The chat-local override sets `DOCUVATE_FEATURE_LOCAL_CHAT_MODEL=true` on the API by default; tenants still need the **`localChatModel`** flag (or override) for open-ended LLM replies.

**Host RAM:** **≥ 8 GiB** recommended with `chat-local` (default Ollama `mem_limit` **2g** unless you raise `OLLAMA_MEM_LIMIT` for larger models).

### Measured component budget (CPU baseline)

Typical resident set sizes on a idle-to-light workload (your mileage varies with corpus size and concurrency):

| Component | Typical RSS |
| --- | ---: |
| Worker with ONNX int8 **`multilingual-e5-small`** + OCR / reranker headroom | **~0.9–1.2 GiB** |
| API + web + Postgres + Valkey + MinIO (idle stack) | ~1.5–2.5 GiB |
| Ollama with **`qwen2.5:1.5b`** (`chat-local` profile) | ~2 GiB (`OLLAMA_MEM_LIMIT`, default **2g**) |

The central document encoder uses **`intfloat/multilingual-e5-small`** as **ONNX Runtime int8 on CPU** (~118 MiB weights on disk). Tune CPU threads with **`DOCUVATE_ENCODER_INTRA_OP_THREADS`** and **`OMP_NUM_THREADS`**.

## Encoder upgrade and background re-index

When the worker embedding model or revision changes (for example switching to the pinned ONNX int8 **`614241f622f53c4eeff9890bdc4f31cfecc418b3-onnx-int8`** revision), new uploads get fresh vectors immediately. Existing documents may still carry an older **`encoder_revision`** on stored representations.

After upgrade, the API enqueues **per-tenant background re-index jobs** (BullMQ, idempotent per tenant and document). Re-embedding runs without blocking uploads. Signed-in users can monitor progress:

```http
GET /v1/settings/encoder-reindex
```

Re-index status includes counts of pending and completed documents for the current tenant. Large libraries may take hours on CPU; leave worker and API running until the queue drains.

## Related environment variables

| Variable | Role |
| --- | --- |
| `DOCUVATE_FEATURE_EXACT_ANSWERS` | Installation default for `exactAnswers` |
| `DOCUVATE_FEATURE_ANSWER_ABSTENTION` | Installation default for `answerAbstention` |
| `DOCUVATE_FEATURE_SMART_DUPLICATES` | Installation default for `smartDuplicates` |
| `DOCUVATE_FEATURE_LEARNED_VALUE_TYPES` | Installation default for `learnedValueTypes` (unset → on) |
| `DOCUVATE_FEATURE_LAYOUT_KEY_VALUE_ROLES` | Installation default for `layoutKeyValueRoles` |
| `DOCUVATE_FEATURE_LOCAL_CHAT_MODEL` | Installation default for `localChatModel` |
| `DOCUVATE_ENCODER_INTRA_OP_THREADS` | ONNX Runtime `intra_op` threads for the document encoder (worker) |
| `OMP_NUM_THREADS` | CPU thread cap (worker / encoder) |
| `OLLAMA_URL` | Ollama base URL (set when using `chat-local`) |
| `OLLAMA_MODEL` | Chat model tag (default **`qwen2.5:1.5b`** in the optional profile) |
| `OLLAMA_MEM_LIMIT` | Docker memory limit for the Ollama service |
| `DOCUMENT_CHAT_PROVIDER` | Chat backend (for example **`rag-ollama`** when Ollama is wired) |
| `DOCUVATE_RERANKER_MODEL` | RAG reranker model id (worker; default **`BAAI/bge-reranker-v2-m3-int8`**) |

Third-party model names, sizes, and licenses are listed in **`THIRD_PARTY_MODELS.md`** in the repository root (Community Edition).

## Community Edition scope

This reference applies to **Docuvate Community Edition** only. Enterprise-only features are not covered here.
