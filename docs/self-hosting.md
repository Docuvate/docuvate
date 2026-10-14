# Self-hosting (Docker Compose)

Docuvate pins **PostgreSQL 18.6** (`postgres:18.6-alpine`) for **StackGres 1.19** compatibility.

## Quickstart and doctor

```bash
bash scripts/quickstart.sh   # checks Docker + RAM, writes .env secrets, pulls GHCR :edge, starts stack
bash scripts/doctor.sh       # containers, health, migrations, worker, embedding coverage, Ollama model, disk/RAM
```

Recommended host RAM: **12 GiB** minimum for the default Compose limits (worker 3g, API 2g, Ollama 3g, plus Postgres/MinIO). Increase `OLLAMA_MEM_LIMIT` only when you have headroom.

Application images default to `ghcr.io/docuvate/docuvate-{api,web,worker}:edge`. Build from source with `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build`.

## Upgrades

1. **Backup** the `pgdata` volume and MinIO `documents` bucket before changing versions.
2. Set image tags in `.env` (`DOCUVATE_API_IMAGE`, `DOCUVATE_WEB_IMAGE`, `DOCUVATE_WORKER_IMAGE`) or run `docker compose pull api web worker migrate`.
3. `docker compose up -d` — the `migrate` one-shot applies schema changes before API and worker start.
4. Run `bash scripts/doctor.sh` and fix any reported failures before handing users the stack.

### PostgreSQL 18 data directory (Compose volume mount)

PostgreSQL **18** images expect the cluster under **`/var/lib/postgresql`** (not the older `/var/lib/postgresql/data` path). Compose mounts the named volume **`pgdata`** there (`docker-compose.yml`). Docker names that volume **`docuvate_pgdata`** when the Compose project name is `docuvate`.

If you upgraded from an earlier Compose file that mounted `pgdata` at `/var/lib/postgresql/data`, Postgres may have written data into a **different** directory inside the volume. Before `docker compose up` on PG 18:

- Inspect the volume (`docker volume inspect docuvate_pgdata`) and confirm data lives under the path the new mount uses, or
- Migrate data with `pg_dump` / `pg_restore` into a fresh volume mounted at `/var/lib/postgresql`.

When the database already contains Docuvate tables but the TypeORM **`migrations`** table is missing or empty (installs from before migration tracking), the migrate job **records a partial baseline**: it stamps only migrations whose schema markers are already present (for example `InitialSchema` when `documents` exists, `FeatureFlags` only when `feature_flag` exists), then runs any newer migrations normally. If the **`migrations`** table is missing, it is created first.

Never use `docker compose down -v` on production data: it deletes Postgres and orphan policies only protect MinIO when the DB is empty.

## Feature flags

Installation-wide **defaults** (when a tenant has no override row) are set in `.env` on the API container:

| Variable | When `true` |
|----------|-------------|
| `DOCUVATE_FEATURE_LAYOUT_RECONSTRUCTION_COMPARE` | Layout reconstruction / SSIM compare (Nachbau/Vergleich) |
| `DOCUVATE_FEATURE_SOURCE_CONNECTORS` | SFTP scanner ingress, SFTP fetch, Paperless-ngx connectors |
| `DOCUVATE_FEATURE_EXPERIMENTAL_RESEARCH_MODELS` | Arena engine compare and non-default extractors |
| `DOCUVATE_FEATURE_EXACT_ANSWERS` | FAKTUM index and cited exact answers in document chat |
| `DOCUVATE_FEATURE_SMART_DUPLICATES` | Template-subtracted duplicate detection |
| `DOCUVATE_FEATURE_ANSWER_ABSTENTION` | Abstention gate against unknown entities in chat |
| `DOCUVATE_FEATURE_LEARNED_VALUE_TYPES` | Learned value types instead of heuristic field regexes |
| `DOCUVATE_FEATURE_LAYOUT_KEY_VALUE_ROLES` | Layout key-value role head on embeddings |
| `DOCUVATE_FEATURE_LOCAL_CHAT_MODEL` | Optional local chat model profile |

Per-tenant overrides are stored in `feature_flag` (tenant id + flag key + enabled). Authenticated clients resolve flags via `GET /v1/remote-config` (override wins over env default). Installation admins can set overrides with `PATCH /v1/admin/users/{userId}/feature-flags`.

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

Helm: `post-install,pre-upgrade` migrate **Job**. Kustomize: Job in `deploy/kustomize/base/jobs/db-migrate.yaml` before API/worker. Same migrate command as Compose. See `deploy/gitops/examples/MIGRATIONS.md`.

## Extensions

| Extension | Used for | `postgres:18.6-alpine` | StackGres 1.19 / PG 18 |
|-----------|----------|-------------------------|-------------------------|
| `pgcrypto` | UUID generation | yes | yes |
| `vector` | Document embeddings | optional (worker) | optional |

## Authentication secrets

Docker Compose requires **`BETTER_AUTH_SECRET`** in a `.env` file (or the shell environment). Use a long random value (at least 32 characters). When the API runs with `NODE_ENV=production`, known placeholders and patterns such as `change-me` or `REPLACE_WITH` are rejected at startup.

Copy `.env.example` to `.env`, set `BETTER_AUTH_SECRET`, then start the stack.

## User registration policy

By default, email/password signup is allowed only until the **first** user account exists. After that, new accounts require an **administrator invitation**. Set **`DV_ALLOW_SIGNUP=true`** to keep open self-registration, or **`DV_ALLOW_SIGNUP=false`** to disable self-registration entirely. CI compose-smoke sets `DV_ALLOW_SIGNUP=true` so tests can register a second user.
