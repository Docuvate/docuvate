DROP INDEX IF EXISTS documents_preview_storage_key_idx;
ALTER TABLE documents DROP COLUMN IF EXISTS preview_storage_key;
