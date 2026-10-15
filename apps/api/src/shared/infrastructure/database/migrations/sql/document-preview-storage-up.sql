ALTER TABLE documents
  ADD COLUMN preview_storage_key text NULL;

CREATE INDEX documents_preview_storage_key_idx
  ON documents (preview_storage_key)
  WHERE preview_storage_key IS NOT NULL;
