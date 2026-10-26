-- Vocabulary is maintained incrementally on ingest (SyncDocumentSearchIndex / indexDocumentChunks).
-- Search-time typo expansion must read only this table (not live chunk scans).

ALTER TABLE search_vocabulary_terms
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS search_vocabulary_terms_user_id_updated_at_idx
  ON search_vocabulary_terms (user_id, updated_at DESC);
