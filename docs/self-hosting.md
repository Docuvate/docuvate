# Self-hosting (Docker Compose)

Docuvate pins **PostgreSQL 18.6** (`postgres:18.6-alpine`) for **StackGres 1.19** compatibility.

## Volumes

| Volume | Role |
|--------|------|
| **`pgdata`** | PostgreSQL 18 cluster data |
| **`miniodata`** | Object storage for document blobs |
| **`workermlcache`** | Worker OCR and embedding model cache |

## Startup chain

**`postgres` (healthy) → `migrate` (`service_completed_successfully`) → `db-storage-guard` → `api` / `worker`**

### Storage mismatch guard (`db-storage-guard`)

Before API and worker start, a one-shot job checks that Postgres and MinIO look consistent:

- If the database has **0 documents** but the MinIO **`documents`** bucket is **non-empty** (existence check via `aws s3 ls --recursive`, not a full inventory), startup **refuses**. This usually means the wrong Postgres volume after a Compose project rename.
- Set **`DOCUVATE_FRESH_STACK=1`** only when you **deliberately** want a **new empty Postgres** and accept orphaned MinIO objects until you clean the bucket.

```bash
export DOCUVATE_FRESH_STACK=1
docker compose --progress plain up -d
```

### Worker ML cache

Compose mounts **`workermlcache`** at `/var/lib/docuvate-ml` (PaddleOCR and fastembed caches via symlinks). Rebuilds (`docker compose up --build`) reuse downloaded OCR weights instead of re-fetching on every image rebuild.

## Database migrations (TypeORM)

Schema changes are TypeORM migration classes in `apps/api/src/shared/infrastructure/database/migrations/` with **`up` and `down`**. The API and worker **do not** run migrations at startup (`migrationsRun: false`, `synchronize: false`).

The **`migrate`** service uses the API image and runs:

`node dist/shared/infrastructure/database/run-migrate.js`

Local CLI (requires `DATABASE_URL`, e.g. `postgresql://docuvate:docuvate@127.0.0.1:5433/docuvate`):

```bash
pnpm db:migrate
pnpm db:revert          # refuses initial schema unless -- --force-baseline
pnpm db:status
pnpm db:new AddMyColumn
pnpm db:generate SyncEntities
```

### Kubernetes

Helm: pre-install/pre-upgrade **Job** (`helm.sh/hook-weight: "-5"`). Kustomize/Argo: sync-wave Job before API/worker. Same migrate command as Compose. Reference YAML: `deploy/kubernetes/migrate-job-helm.yaml`, `deploy/kubernetes/migrate-job-kustomize.yaml`.

## Extensions

| Extension | Used for | `postgres:18.6-alpine` | StackGres 1.19 / PG 18 |
|-----------|----------|-------------------------|-------------------------|
| `pgcrypto` | UUID generation | yes | yes |
| `vector` | Document embeddings | optional (worker) | optional |
