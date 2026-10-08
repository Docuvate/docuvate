-- Reverts SchemaNormalization3nf20261008131000 to the schema left by the global search migrations.
-- Index rows of the global search shape of document_field_values are rebuilt by the migration class.

-- 3. Owner columns.
ALTER TABLE document_text_chunks ADD COLUMN user_id TEXT;
UPDATE document_text_chunks c SET user_id = d.user_id FROM documents d WHERE d.id = c.document_id;
ALTER TABLE document_text_chunks ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE document_text_chunks
  ADD CONSTRAINT document_text_chunks_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
CREATE INDEX document_text_chunks_user_id_idx ON document_text_chunks(user_id);

ALTER TABLE document_stack_members ADD COLUMN user_id TEXT;
UPDATE document_stack_members m SET user_id = s.user_id FROM document_duplicate_stacks s WHERE s.id = m.stack_id;
ALTER TABLE document_stack_members ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE document_stack_members
  ADD CONSTRAINT document_stack_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

ALTER TABLE tag_embedding_centroids ADD COLUMN user_id TEXT;
UPDATE tag_embedding_centroids tec SET user_id = t.user_id FROM tags t WHERE t.id = tec.tag_id;
ALTER TABLE tag_embedding_centroids ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE tag_embedding_centroids
  ADD CONSTRAINT tag_embedding_centroids_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
CREATE INDEX tag_embedding_centroids_user_id_idx ON tag_embedding_centroids USING btree (user_id);

ALTER TABLE document_embeddings ADD COLUMN user_id TEXT;
UPDATE document_embeddings de SET user_id = d.user_id FROM documents d WHERE d.id = de.document_id;
ALTER TABLE document_embeddings ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE document_embeddings
  ADD CONSTRAINT document_embeddings_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
CREATE INDEX document_embeddings_user_id_idx ON document_embeddings USING btree (user_id);

DROP INDEX chat_thread_documents_document_idx;
ALTER TABLE chat_thread_documents ADD COLUMN user_id TEXT;
UPDATE chat_thread_documents ctd SET user_id = t.user_id FROM chat_threads t WHERE t.id = ctd.thread_id;
ALTER TABLE chat_thread_documents ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE chat_thread_documents
  ADD CONSTRAINT chat_thread_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
CREATE INDEX chat_thread_documents_document_idx ON chat_thread_documents USING btree (document_id, user_id);

-- 2. documents.extracted_fields is rebuilt from the relational rows.
ALTER TABLE documents ADD COLUMN extracted_fields JSONB;
UPDATE documents d
SET extracted_fields = jsonb_build_object(
  'fields', COALESCE(
    (SELECT jsonb_agg(
              jsonb_strip_nulls(jsonb_build_object(
                'key', v.field_storage_key,
                'value', v.value_text,
                'confidence', v.confidence,
                'tagId', substring(v.field_storage_key FROM '^label:([0-9a-fA-F-]{36}):')
              ))
              ORDER BY v.field_storage_key)
     FROM document_field_values v WHERE v.document_id = d.id),
    '[]'::jsonb),
  'blocks', COALESCE(
    (SELECT jsonb_agg(
              jsonb_strip_nulls(jsonb_build_object(
                'page', b.page,
                'x', b.x,
                'y', b.y,
                'width', b.width,
                'height', b.height,
                'text', b.text,
                'blockIndex', b.block_index
              ))
              ORDER BY b.position)
     FROM document_extraction_blocks b WHERE b.document_id = d.id),
    '[]'::jsonb)
)
WHERE EXISTS (SELECT 1 FROM document_field_values v WHERE v.document_id = d.id)
   OR EXISTS (SELECT 1 FROM document_extraction_blocks b WHERE b.document_id = d.id);

DROP TABLE document_extraction_blocks;
DROP TABLE document_field_values;

CREATE TABLE document_field_values (
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
CREATE INDEX document_field_values_user_idx ON document_field_values(user_id);
CREATE INDEX document_field_values_document_idx ON document_field_values(document_id);
CREATE INDEX document_field_values_text_trgm_idx
  ON document_field_values USING GIN (value_text_norm gin_trgm_ops)
  WHERE value_text_norm IS NOT NULL;
CREATE INDEX document_field_values_numeric_idx
  ON document_field_values(user_id, field_type, value_numeric)
  WHERE value_numeric IS NOT NULL;
CREATE INDEX document_field_values_date_idx
  ON document_field_values(user_id, field_type, value_date)
  WHERE value_date IS NOT NULL;

-- 1. Junction tables back to JSONB arrays.
ALTER TABLE extraction_arena_ratings ADD COLUMN compared_engines JSONB DEFAULT '[]'::jsonb NOT NULL;
UPDATE extraction_arena_ratings ar
SET compared_engines = COALESCE(
  (SELECT jsonb_agg(e.engine_name ORDER BY e.sort_order, e.engine_name)
   FROM extraction_arena_rating_compared_engines e WHERE e.rating_id = ar.id),
  '[]'::jsonb);

ALTER TABLE extraction_field_corrections ADD COLUMN label_tag_ids JSONB DEFAULT '[]'::jsonb NOT NULL;
UPDATE extraction_field_corrections c
SET label_tag_ids = COALESCE(
  (SELECT jsonb_agg(l.tag_id::text ORDER BY l.tag_id)
   FROM extraction_field_correction_labels l WHERE l.correction_id = c.id),
  '[]'::jsonb);

ALTER TABLE user_preferences ADD COLUMN field_extraction_required_label_ids JSONB DEFAULT '[]'::jsonb NOT NULL;
UPDATE user_preferences up
SET field_extraction_required_label_ids = COALESCE(
  (SELECT jsonb_agg(l.tag_id::text ORDER BY l.tag_id)
   FROM user_preference_required_labels l WHERE l.user_id = up.user_id),
  '[]'::jsonb);

ALTER TABLE recognized_field_definitions ADD COLUMN gate_label_ids JSONB DEFAULT '[]'::jsonb NOT NULL;
UPDATE recognized_field_definitions r
SET gate_label_ids = COALESCE(
  (SELECT jsonb_agg(g.tag_id::text ORDER BY g.tag_id)
   FROM recognized_field_definition_gate_labels g WHERE g.field_definition_id = r.id),
  '[]'::jsonb);

DROP TABLE extraction_arena_rating_compared_engines;
DROP TABLE extraction_field_correction_labels;
DROP TABLE user_preference_required_labels;
DROP TABLE recognized_field_definition_gate_labels;
