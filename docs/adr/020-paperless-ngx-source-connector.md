# ADR 020: Paperless-ngx source connector

## Status

Accepted

## Context

Docuvate needs a first-class **import-only** connector for [Paperless-ngx](https://github.com/paperless-ngx/paperless-ngx) (2.x and 3.x) so households can migrate archives with labels, correspondents, folders, and custom fields without write-back to Paperless.

## Decision

### Connector role

- Plugin `paperless` is **source-only** (no sink / no `post_document` export).
- Connection uses base URL plus API token, or username/password to obtain a token via `/api/token/`.
- API version is negotiated with `Accept: application/json; version=N` (try 3, then 2).

### Persistence (3NF)

| Table | Purpose |
| --- | --- |
| `connector_source_documents` | Idempotent link `(installation_id, source_document_id)` → `document_id`, plus checksum and `source_modified_at` |
| `connector_paperless_settings` | 1:1 with `connector_installations`: pipeline flags (keep OCR, rerun OCR, include archived PDF) and incremental watermark `last_successful_modified_at` |
| `connector_paperless_tag_links` | `(installation_id, paperless_id)` → `tags.id` |
| `connector_paperless_document_type_links` | `(installation_id, paperless_id)` → `tags.id` (document type as label) |
| `connector_paperless_correspondent_links` | `(installation_id, paperless_id)` → `correspondents.id` |
| `connector_paperless_folder_links` | `(installation_id, paperless_id)` → `folders.id` |
| `connector_paperless_field_links` | `(installation_id, paperless_id)` → `recognized_field_definitions.id` |
| `connector_import_runs` | Run status, progress, resume cursor (`resume_page`, `resume_modified_cursor`), incremental filter snapshot (`incremental_modified_gt`), OCR mode; owner via `installation_id` → `connector_installations.user_id` |
| `connector_import_run_errors` | Per-document errors (does not abort the run) |
| `documents.archived_storage_key` | Optional archived PDF blob key when enabled |

Dry-run preview counts are computed in memory for the API response only; they are not persisted.

### Domain mapping

| Paperless | Docuvate |
| --- | --- |
| Tags | Labels (`tags`), colors preserved |
| Document type | Label (same as tag row) |
| Correspondent | `correspondents` (Absender) |
| Storage path | Root `folders` row by name |
| Custom fields | `recognized_field_definitions` + `document_field_values` |
| OCR `content` | `documents.extracted_text` when `keep_paperless` |
| ASN | `document_field_values` under `global:paperless_asn` |
| Notes | `documents.notes` |
| `created` | `documents.document_date` |
| Original file | Primary `storage_key` via `/download/?original=true` |
| Archived PDF | Optional `archived_storage_key` |

Custom field types: `string`, `url`, `boolean`, `select`, `documentlink` → text field values; `date` → date; `integer`/`float` → number; `monetary` → currency. `documentlink` stays a text value (no document-reference graph in core).

### Incremental import

- Re-import uses Paperless `modified__gt` from the last processed modification cursor (watermark stored on `connector_paperless_settings`, created on first successful run even if pipeline options were never saved).
- Skip only when both Paperless checksum and `source_modified_at` are unchanged; metadata-only changes update Docuvate without re-downloading the file.
- A re-import after Paperless changes **overwrites** local edits to imported fields (title, labels, folder, notes, custom field values) with the Paperless snapshot. Labels are replaced, not merged.

### Network safety

- Paperless `base_url` is validated (http/https, no userinfo/query/fragment, DNS/IP checks, manual redirect handling). Private networks are allowed by default (`DV_CONNECTOR_ALLOW_PRIVATE_NETWORKS`); link-local and cloud metadata ranges are always blocked.

### Pipeline

- Default: keep Paperless OCR text, set status `ready`, run post-OCR pipeline (field extraction and label recommendations).
- Optional: `rerun_docuvate` queues full Docuvate OCR instead.

## Consequences

- BullMQ job `connector-paperless-import` processes runs with rate limiting and resumes pending runs after API restart.
- OpenAPI documents `/connectors/plugins/paperless/test-connection` and installation import endpoints.
