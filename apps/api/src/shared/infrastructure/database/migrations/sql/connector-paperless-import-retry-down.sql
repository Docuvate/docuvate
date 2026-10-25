ALTER TABLE connector_import_runs
  DROP COLUMN IF EXISTS retry_source_document_ids;

ALTER TABLE connector_import_run_errors
  DROP COLUMN IF EXISTS message_params_json,
  DROP COLUMN IF EXISTS source_document_title;
