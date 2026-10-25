ALTER TABLE connector_import_run_errors
  ADD COLUMN source_document_title text,
  ADD COLUMN message_params_json text;

ALTER TABLE connector_import_runs
  ADD COLUMN retry_source_document_ids text[];
