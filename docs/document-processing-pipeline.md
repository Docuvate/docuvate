# Document processing pipeline

Post-OCR steps run in a fixed order via `DocumentPipelineRegistry` (API). OCR itself stays in `RunExtractionUseCase` as step zero.

## Current modules (defaults)

| Order | id | Purpose |
|------:|----|---------|
| 0 | `ocr` | Worker `/v1/extract` — text, blocks, baseline heuristics |
| 10 | `label_matching` | Rule-based tag assign / suggest |
| 20 | `embedding_suggestions` | Embedding similarity suggestions |
| 30 | `global_recognized_fields` | Erkannte-Felder catalog; optional gate (confidence + required labels AND) |
| 40 | `label_attached_fields` | Archival no-op (extraction moved to catalog + gate) |
| 50 | `duplicate_detection` | Hash / embedding duplicate candidates |

Read-only catalog: `GET /v1/document-pipeline/modules`.

## Field storage keys

- Global catalog: `global:{fieldKey}` (e.g. `global:datum`)
- Label-attached (plain keys): `label:{tagId}:{fieldKey}`

## Field correction feedback

User corrections in document detail are stored in `extraction_field_corrections` (document id, field key, old/new value, label context). Export: `GET /v1/extraction-feedback/field-corrections` for pipeline re-finetune jobs.

## Future workflow UI

1. Persist per-user config, e.g. `user_preferences.pipeline_modules JSONB` as `{ id, enabled, order }[]`.
2. Filter/sort `DocumentPipelineRegistry.runPostOcr` against that config instead of `defaultEnabled` / `defaultOrder`.
3. Register new modules by implementing `DocumentPipelineModule`, adding a Nest provider, and calling `registry.register()` in `DocumentPipelineModule` bootstrap.
4. Optional: expose enable/disable without redeploy by loading module list from DB and resolving handlers by `id`.

Worker mirror (optional): `apps/worker/src/docuvate_worker/application/post_ocr_pipeline.py` defines the same ids for steps that run inside the worker; today field extraction is invoked from the API via `/v1/extract/label-fields`.
