ALTER TABLE connector_import_run_errors
  ADD COLUMN IF NOT EXISTS source_document_title text;

ALTER TABLE connector_import_run_errors
  ADD COLUMN IF NOT EXISTS message_params_json text;

ALTER TABLE connector_import_runs
  ADD COLUMN IF NOT EXISTS retry_source_document_ids text[];
