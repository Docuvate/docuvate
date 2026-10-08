# Database migrations (developer guide)

TypeORM owns **all DDL** in the API repo. See [ADR 017](../adr/017-typeorm-migrations-phase1.md) for architecture; this page is the day-to-day checklist.

**Layout**

| Path | Purpose |
|------|---------|
| `apps/api/src/shared/infrastructure/database/migrations/` | Migration classes (`up` / `down`) |
| `apps/api/src/shared/infrastructure/database/migrations/sql/` | Optional raw SQL for extensions, triggers, FTS |
| `apps/api/src/shared/infrastructure/database/entities/` | Persistence entities (sync with schema) |

**Compose / CI:** Postgres **18.6** → one-shot **`migrate`** job → `db-storage-guard` → api/worker. Local CLI: `pnpm db:*` (wraps `scripts/db/typeorm-cli.sh`).

## Add a schema change

1. **Entity** — Update or add under `entities/`. Regenerate from DB only when intentionally syncing: `node scripts/db/sync-typeorm-entities.mjs` (prefer hand-editing for small deltas).

2. **Migration** — Pick one:
   - **Generated:** With `DATABASE_URL` set and schema matching entities,  
     `pnpm db:generate DescriptiveName`  
     Review the generated class; move heavy DDL into `migrations/sql/*.sql` if needed.
   - **Hand-written:**  
     `pnpm db:new DescriptiveName`  
     Implement `up`/`down` (call SQL files or `queryRunner` APIs).

3. **Down** — Every migration must revert cleanly. The **initial schema** migration must not be reverted in production without `--force-baseline` (drops all tables).

4. **Verify locally** (Postgres 18.6, e.g. Compose on `:5433` or a disposable container):

   ```bash
   export DATABASE_URL=postgresql://docuvate:docuvate@127.0.0.1:5433/docuvate
   bash scripts/db/migration-roundtrip-check.sh
   ```

   That runs migrate → blocked baseline revert → force revert → migrate → `migration-generate-check.sh` (structural entity drift only; FK metadata noise is ignored in phase 1).

5. **PR** — Include entity + migration + any SQL sidecars. No worker DDL.

## Commands

| Command | Meaning |
|---------|---------|
| `pnpm db:migrate` | Run pending migrations |
| `pnpm db:revert` | Revert last migration (initial schema blocked) |
| `pnpm db:status` | Show applied migrations |
| `pnpm db:new Name` | Empty migration stub |
| `pnpm db:generate Name` | Diff entities vs DB → migration |

Initial schema revert: `pnpm db:revert -- --force-baseline` (destructive; local/CI roundtrip only).
