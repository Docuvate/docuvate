# ADR 017: TypeORM migrations (phase 1)

## Status

Accepted (pre-TypeORM adoption **superseded** 2026-10-08: fresh-start decision; greenfield installs only.)

## Context

Docuvate needs versioned **up/down** schema changes, a **one-shot migrate job** in Compose/Kubernetes, and alignment between the NestJS API and the Python worker (worker keeps raw SQL reads/writes; **all DDL** lives in the API repo).

We evaluated dbmate (plain SQL, language-neutral) but the owner chose **TypeORM** for migrations and a future repository phase without a separate ORM rewrite.

## Decision (phase 1)

Developer workflow: [../development/migrations.md](../development/migrations.md).

- **TypeORM** (`typeorm`, `@nestjs/typeorm`) with `synchronize: false`, `migrationsRun: false` — the API never migrates on boot.
- **Entities** under `apps/api/src/shared/infrastructure/database/entities/` as persistence models; domain/application stay ORM-free with existing mappers.
- **Migrations** as classes in `…/database/migrations/` with `up`/`down` (raw SQL files for extension/trigger/FTS DDL).
- **Compose `migrate` service:** same API image, `node dist/…/run-migrate.js` (`runMigrations()` only).
- **CI:** migration roundtrip + `migration:generate --check` (empty diff after migrate).

### Phase 2 (repository migration — after current PR wave)

Move adapters module-by-module from raw `pg` pools to TypeORM repositories:

1. Health / auth-adjacent read paths (minimal)
2. Settings / user preferences
3. Taxonomy, tags, folders, mappen
4. Documents + search (hybrid: keep `query()` / QueryBuilder for FTS `tsvector`, trigram, RRF ranking where ORM is awkward)
5. Duplicates, labels embeddings, chat threads
6. Connectors, model registry, extraction feedback

**Stay raw SQL:** full-text search updates, complex duplicate detection queries, any RRF/trigram SQL proven in production.

**Python worker:** continues SQLAlchemy/psycopg-style access; never ships DDL; consumes schema from TypeORM migrations only.

### Coordination

- **Compose:** `postgres` healthy → `migrate` → `db-storage-guard` → `api` / `worker`.
- **#86 (K8s):** Helm pre-install/pre-upgrade Job; Kustomize sync-wave `-5`. Reference manifests: `deploy/kubernetes/migrate-job-helm.yaml`, `deploy/kubernetes/migrate-job-kustomize.yaml` (same command as Compose).

## Consequences

- Two persistence styles temporarily (TypeORM entities + raw `pg` repos) until phase 2 completes.
- Every schema PR: entity + migration (up/down) + passing `generate-check`.
