# Architecture

Docuvate follows **Clean Architecture** in the API and worker:

- **Domain:** entities, ports, domain errors (no framework imports).
- **Application:** use cases orchestrating ports.
- **Infrastructure:** Postgres, MinIO, Valkey queue, HTTP worker client, better-auth.
- **Presentation:** Nest controllers, React routes.

## Runtime topology

```mermaid
flowchart LR
  Web["Web app"] --> API["NestJS API"]
  API --> Postgres[("PostgreSQL")]
  API --> MinIO[("MinIO")]
  API --> Valkey[("Valkey")]
  API --> Worker["FastAPI worker"]
```

Compose ships without a collector (OTEL off). Production can export to SigNoz/Sentry via `packages/otel`.

## Ports (MVP)

| Port | Implementation |
|------|----------------|
| DocumentRepository | Postgres |
| ObjectStorage | MinIO |
| ExtractionPort | HTTP → worker |
| SearchPort | Postgres FTS + ILIKE |
| Session auth | better-auth adapter |
| IdentityProviderPort | stub (extension point for external identity providers) |
| PaperlessImportPort | stub |
| DocumentChatPort | Router + providers: context (worker), donut-ml, ollama, mock (`DOCUMENT_CHAT_PROVIDER`, Settings) |
| FolderRepository | Postgres nested folders |
| DuplicateRepository | Postgres candidates (hash + embedding) |
| DuplicateStackRepository | Persisted primary/version stacks for list collapse |
| EmbeddingPort | HTTP → worker `/embed` (e5-small) |
| JobOutboxRepository | Postgres transactional outbox (Valkey/BullMQ relay) |


## Job outbox (extraction)

Document extraction is scheduled via a transactional **job outbox** in Postgres (`job_outbox` + `job_types`).
The API writes the outbox row and sets `documents.status = queued` in one transaction, then a relay
publishes due rows to Valkey/BullMQ. On Valkey loss the relay reclaims `pending` / stuck `enqueued|running`
rows (lease timeout). The BullMQ worker updates outbox status (`running` → `done` / retry / `failed`)
with exponential backoff. Idempotency key: `document-extraction:<documentId>`.

See `docs/ai-models.md` for model mapping.
