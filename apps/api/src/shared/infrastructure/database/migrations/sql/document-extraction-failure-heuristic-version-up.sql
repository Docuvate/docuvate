ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS extraction_failure_reason text;

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS heuristic_field_extractor_version integer NOT NULL DEFAULT 0;
