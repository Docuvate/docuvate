-- Global search (ADR 016): pg_trgm + unaccent; JSONB embeddings in document_text_chunks.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TABLE IF NOT EXISTS document_text_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  body TEXT NOT NULL,
  search_vector TSVECTOR,
  embedding JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS document_text_chunks_user_id_idx ON document_text_chunks(user_id);
CREATE INDEX IF NOT EXISTS document_text_chunks_document_id_idx ON document_text_chunks(document_id);
CREATE INDEX IF NOT EXISTS document_text_chunks_search_idx ON document_text_chunks USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS document_text_chunks_body_trgm_idx ON document_text_chunks USING GIN (body gin_trgm_ops);

CREATE TABLE IF NOT EXISTS search_vocabulary_terms (
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('document', 'chunk')),
  doc_frequency INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, term)
);

CREATE INDEX IF NOT EXISTS search_vocabulary_terms_trgm_idx ON search_vocabulary_terms USING GIN (term gin_trgm_ops);

CREATE INDEX IF NOT EXISTS documents_title_trgm_idx ON documents USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS documents_filename_trgm_idx ON documents USING GIN (filename gin_trgm_ops);
CREATE INDEX IF NOT EXISTS folders_name_trgm_idx ON folders USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS tags_name_trgm_idx ON tags USING GIN (name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS document_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  field_storage_key TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'date', 'number', 'currency')),
  value_text TEXT NOT NULL DEFAULT '',
  value_text_norm TEXT,
  value_numeric NUMERIC,
  value_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, field_storage_key)
);

CREATE INDEX IF NOT EXISTS document_field_values_user_idx ON document_field_values(user_id);
CREATE INDEX IF NOT EXISTS document_field_values_document_idx ON document_field_values(document_id);
CREATE INDEX IF NOT EXISTS document_field_values_text_trgm_idx
  ON document_field_values USING GIN (value_text_norm gin_trgm_ops)
  WHERE value_text_norm IS NOT NULL;
CREATE INDEX IF NOT EXISTS document_field_values_numeric_idx
  ON document_field_values(user_id, field_type, value_numeric)
  WHERE value_numeric IS NOT NULL;
CREATE INDEX IF NOT EXISTS document_field_values_date_idx
  ON document_field_values(user_id, field_type, value_date)
  WHERE value_date IS NOT NULL;

CREATE OR REPLACE FUNCTION document_text_chunks_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('german', coalesce(NEW.body, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.body, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS document_text_chunks_search_vector_trigger ON document_text_chunks;
CREATE TRIGGER document_text_chunks_search_vector_trigger
  BEFORE INSERT OR UPDATE OF body ON document_text_chunks
  FOR EACH ROW EXECUTE FUNCTION document_text_chunks_search_vector_update();
