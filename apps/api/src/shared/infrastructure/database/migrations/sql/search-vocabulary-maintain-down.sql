DROP INDEX IF EXISTS search_vocabulary_terms_user_id_updated_at_idx;

ALTER TABLE search_vocabulary_terms
  DROP COLUMN IF EXISTS updated_at;
