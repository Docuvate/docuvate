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
  Postgres -. transactional outbox .-> API
```

Document extraction uses a **transactional outbox** (`job_outbox` in Postgres). Scheduling writes the outbox row in the same DB transaction as the document `queued` status. `OutboxRelayService` pushes due rows into Valkey/BullMQ and reclaims lease-expired `enqueued`/`running` rows after a Valkey or worker loss. The BullMQ worker updates outbox status (`running` → `done` / retry / `failed`); retries use exponential backoff owned by the outbox (BullMQ `attempts: 1`).

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
| JobOutboxRepository | Postgres `job_outbox` + `job_types` |
| JobOutboxRelay | Nest `OutboxRelayService` → BullMQ |

See `docs/ai-models.md` for model mapping.
