# ADR 015: Database schema in at least third normal form

**Status:** accepted
**Date:** 2026-10-08

## Context

Docuvate stores relationships and domain attributes in PostgreSQL. Repeating groups, JSON arrays of foreign keys and silent denormalization make correctness, migrations and parallel feature work harder: values drift apart, foreign keys cannot be enforced and every reader has to re-implement parsing.

## Decision

1. **Every production table is at least in third normal form (3NF).** No non-key column depends on another non-key column, and no stored value can be derived from other stored values, unless it is listed under "Documented denormalization" below.
2. **1NF:** no repeating groups. In particular no CSV strings, PostgreSQL arrays or JSONB arrays of ids for relationships the application filters, joins, validates or updates one by one. Such sets are junction tables with foreign keys.
3. **JSONB only for opaque payloads** that are never filtered, joined or aggregated by attribute in SQL. Every allowed JSONB column is listed in `apps/api/src/shared/infrastructure/database/schema-jsonb-allowlist.ts` and in the table below.
4. **Enumerations** use a `CHECK` constraint or a lookup table.
5. **Denormalization** needs an entry in this ADR with its source columns and the code path that keeps it current. Nothing is denormalized silently.
6. **Ownership is stored once.** A child row reaches its owner through its parent (`documents.user_id`, `chat_threads.user_id`, `document_duplicate_stacks.user_id`, `tags.user_id`) instead of repeating `user_id`.

Schema changes are TypeORM migrations (`MigrationInterface` with `up` and `down`, SQL under `apps/api/src/shared/infrastructure/database/migrations/sql/`). Entities must match the migrated schema (`scripts/db/migration-generate-check.sh` in CI), and every migration must survive the roundtrip in `scripts/db/migration-roundtrip-check.sh`. Runtime: PostgreSQL 18.6.

## Implementation

The migration `SchemaNormalization3nf20261008131000` runs after the global search migrations (ADR 016) and:

| Before | Problem | After |
| --- | --- | --- |
| `recognized_field_definitions.gate_label_ids` | JSONB array of tag ids | `recognized_field_definition_gate_labels` |
| `user_preferences.field_extraction_required_label_ids` | JSONB array of tag ids | `user_preference_required_labels` |
| `extraction_field_corrections.label_tag_ids` | JSONB array of tag ids | `extraction_field_correction_labels` |
| `extraction_arena_ratings.compared_engines` | JSONB array of names | `extraction_arena_rating_compared_engines` (with `sort_order`) |
| `documents.extracted_fields` | JSONB with field list and layout blocks | `document_field_values` and `document_extraction_blocks` |
| `document_field_values.user_id`, `field_label`, `field_type` | copies of the owner and of the field definition | removed; read from `documents` and the field definitions |
| `user_id` on `document_embeddings`, `document_text_chunks`, `document_stack_members`, `chat_thread_documents`, `tag_embedding_centroids` | repeats the owner of the parent row | removed; resolved through the parent |

`document_field_values` is the single source of truth for extracted field values: primary key `(document_id, field_storage_key)`, raw `value_text` and `confidence`. Label fields are stored under `label:<tagId>:<key>`, global fields under `global:<key>`. `document_extraction_blocks` keeps layout blocks with their original order in `position`.

Only junction rows whose tag exists (and belongs to the same user on writes) are kept. Ids in the old JSONB arrays that pointed to deleted tags are dropped by the migration.

`down` restores the previous schema including foreign keys, indexes and data: `documents.extracted_fields` is rebuilt from the tables, the JSONB arrays from the junction tables and the owner columns from the parent rows. The global search index rows of the previous shape are rebuilt by the migration class.

## Allowed JSONB columns

| Table | Column | Reason |
| --- | --- | --- |
| `document_embeddings` | `embedding` | Vector body; similarity is computed in the application |
| `document_text_chunks` | `embedding` | Reserved chunk vector (ADR 016); never queried by attribute |
| `tag_embedding_centroids` | `centroid` | Aggregated vector |
| `extraction_arena_ratings` | `compare_snapshot` | UI comparison snapshot, not used in joins |
| `ml_training_data_snapshots` | `metadata` | Opaque dataset description |
| `ml_model_versions` | `metrics` | Opaque metric map per version |

## Documented denormalization

| Table | Columns | Derived from | Kept current by |
| --- | --- | --- | --- |
| `documents` | `search_vector` | `filename`, `title`, `notes`, `extracted_text` | database trigger |
| `document_text_chunks` | all rows, `search_vector` | `documents.extracted_text` | `SyncDocumentSearchIndexUseCase`; chunk trigger |
| `search_vocabulary_terms` | all rows | titles, filenames, extracted text | `SyncDocumentSearchIndexUseCase` |
| `document_field_values` | `value_text_norm`, `value_numeric`, `value_date` | `value_text` and the type of the field definition | the single writer `replaceDocumentFieldValues` |
| `tag_embedding_centroids` | `sample_count` | number of embeddings merged into the running mean | `RecordEmbeddingFeedbackUseCase` |

The search columns of `document_field_values` exist so that amount and date filters (`betrag:12,50`, `rechnungsdatum:15.03.2024`) use an index instead of parsing every value per query. When the type of a field definition changes, the derived columns of existing rows are refreshed by the next write of that document.

`tag_embedding_centroids.sample_count` depends only on `tag_id`. It is the weight of the running mean and cannot be recomputed from other rows, because the merged embeddings are not stored.

## Known deviations (follow-ups)

- `user_id` is still repeated on `tag_custom_field_definitions`, `tag_embedding_feedback`, `document_duplicate_candidates`, `extraction_arena_ratings` and `extraction_field_corrections`. Each can be derived from the tag or document it references.
- `documents.mappe_id` and `documents.folder_id` both express placement, and `folders.mappe_id` repeats it for folders. The placement rules allow either path, so this is not a transitive dependency today, but it should become one placement relation.

## Consequences

- A new JSONB column needs an allowlist entry and an update of this ADR; `schema-normalization.guard.spec.ts` fails otherwise.
- `worker-schema-wiring.spec.ts` keeps seed scripts, tools and the worker from writing the removed columns.
- Readers of child tables join the parent row for ownership checks.

## Self-hosted upgrade

1. Back up the database before upgrading:

   ```bash
   pg_dump "$DATABASE_URL" -Fc -f "docuvate-pre-3nf-$(date +%Y%m%d).dump"
   ```

2. Run the migrations (compose migrate job, or locally):

   ```bash
   pnpm --filter @docuvate/api build
   DATABASE_URL='postgresql://...' node apps/api/scripts/run-migrations.mjs
   ```

3. Check that every document with extraction text still has its field values:

   ```sql
   SELECT d.id
   FROM documents d
   WHERE d.status = 'ready'
     AND d.extracted_text IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM document_field_values v WHERE v.document_id = d.id);
   ```

   Documents without extracted fields are expected in this list; compare it with the field count before the upgrade.
