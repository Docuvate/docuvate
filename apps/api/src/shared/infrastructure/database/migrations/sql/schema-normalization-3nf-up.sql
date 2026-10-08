-- ADR 015: schema normalization to 3NF.
-- Runs after InitialSchema20261008120000 and the global search migrations (20261008130500..130700).

-- 1. Relationship sets stored as JSONB arrays become junction tables.
CREATE TABLE recognized_field_definition_gate_labels (
  field_definition_id UUID NOT NULL REFERENCES recognized_field_definitions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (field_definition_id, tag_id)
);
CREATE INDEX recognized_field_definition_gate_labels_tag_idx
  ON recognized_field_definition_gate_labels(tag_id);

CREATE TABLE user_preference_required_labels (
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, tag_id)
);
CREATE INDEX user_preference_required_labels_tag_idx
  ON user_preference_required_labels(tag_id);

CREATE TABLE extraction_field_correction_labels (
  correction_id UUID NOT NULL REFERENCES extraction_field_corrections(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (correction_id, tag_id)
);
CREATE INDEX extraction_field_correction_labels_tag_idx
  ON extraction_field_correction_labels(tag_id);

CREATE TABLE extraction_arena_rating_compared_engines (
  rating_id UUID NOT NULL REFERENCES extraction_arena_ratings(id) ON DELETE CASCADE,
  engine_name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (rating_id, engine_name)
);

INSERT INTO recognized_field_definition_gate_labels (field_definition_id, tag_id)
SELECT r.id, t.id
FROM recognized_field_definitions r
CROSS JOIN LATERAL jsonb_array_elements_text(r.gate_label_ids) AS elem(value)
JOIN tags t ON t.id::text = elem.value
ON CONFLICT DO NOTHING;
ALTER TABLE recognized_field_definitions DROP COLUMN gate_label_ids;

INSERT INTO user_preference_required_labels (user_id, tag_id)
SELECT up.user_id, t.id
FROM user_preferences up
CROSS JOIN LATERAL jsonb_array_elements_text(up.field_extraction_required_label_ids) AS elem(value)
JOIN tags t ON t.id::text = elem.value
ON CONFLICT DO NOTHING;
ALTER TABLE user_preferences DROP COLUMN field_extraction_required_label_ids;

INSERT INTO extraction_field_correction_labels (correction_id, tag_id)
SELECT c.id, t.id
FROM extraction_field_corrections c
CROSS JOIN LATERAL jsonb_array_elements_text(c.label_tag_ids) AS elem(value)
JOIN tags t ON t.id::text = elem.value
ON CONFLICT DO NOTHING;
ALTER TABLE extraction_field_corrections DROP COLUMN label_tag_ids;

INSERT INTO extraction_arena_rating_compared_engines (rating_id, engine_name, sort_order)
SELECT ar.id, trim(elem.value), (elem.ordinality - 1)::int
FROM extraction_arena_ratings ar
CROSS JOIN LATERAL jsonb_array_elements_text(ar.compared_engines) WITH ORDINALITY AS elem(value, ordinality)
WHERE trim(elem.value) <> ''
ON CONFLICT DO NOTHING;
ALTER TABLE extraction_arena_ratings DROP COLUMN compared_engines;

-- 2. documents.extracted_fields (JSONB) becomes relational: one row per field value and per layout block.
--    document_field_values (global search index until now) becomes the single source of truth.
DROP TABLE document_field_values;

CREATE TABLE document_field_values (
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  field_storage_key TEXT NOT NULL,
  value_text TEXT NOT NULL DEFAULT '',
  confidence REAL,
  value_text_norm TEXT,
  value_numeric NUMERIC,
  value_date DATE,
  PRIMARY KEY (document_id, field_storage_key)
);
CREATE INDEX document_field_values_text_trgm_idx
  ON document_field_values USING GIN (value_text_norm gin_trgm_ops)
  WHERE value_text_norm IS NOT NULL;
CREATE INDEX document_field_values_numeric_idx
  ON document_field_values(value_numeric)
  WHERE value_numeric IS NOT NULL;
CREATE INDEX document_field_values_date_idx
  ON document_field_values(value_date)
  WHERE value_date IS NOT NULL;

CREATE TABLE document_extraction_blocks (
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  position INT NOT NULL,
  page INT NOT NULL,
  block_index INT,
  x DOUBLE PRECISION NOT NULL,
  y DOUBLE PRECISION NOT NULL,
  width DOUBLE PRECISION NOT NULL,
  height DOUBLE PRECISION NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (document_id, position)
);

-- Field values keep the storage key used by the API (`global:<key>`, `label:<tagId>:<key>` or plain key).
-- Derived search columns are filled by the migration class right after this script.
INSERT INTO document_field_values (document_id, field_storage_key, value_text, confidence)
SELECT d.id,
       CASE
         WHEN f.value ? 'tagId' AND (f.value->>'key') NOT LIKE 'label:%'
           THEN 'label:' || (f.value->>'tagId') || ':' || trim(f.value->>'key')
         ELSE trim(f.value->>'key')
       END,
       COALESCE(f.value->>'value', ''),
       NULLIF(f.value->>'confidence', '')::real
FROM documents d
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(d.extracted_fields->'fields') = 'array' THEN d.extracted_fields->'fields' ELSE '[]'::jsonb END
) AS f(value)
WHERE d.extracted_fields IS NOT NULL
  AND COALESCE(trim(f.value->>'key'), '') <> ''
ON CONFLICT (document_id, field_storage_key) DO NOTHING;

INSERT INTO document_extraction_blocks (document_id, position, page, block_index, x, y, width, height, text)
SELECT d.id,
       (b.ordinality - 1)::int,
       COALESCE(NULLIF(b.value->>'page', '')::int, 1),
       NULLIF(b.value->>'blockIndex', '')::int,
       COALESCE(NULLIF(b.value->>'x', '')::double precision, 0),
       COALESCE(NULLIF(b.value->>'y', '')::double precision, 0),
       COALESCE(NULLIF(b.value->>'width', '')::double precision, 0),
       COALESCE(NULLIF(b.value->>'height', '')::double precision, 0),
       COALESCE(b.value->>'text', '')
FROM documents d
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(d.extracted_fields->'blocks') = 'array' THEN d.extracted_fields->'blocks' ELSE '[]'::jsonb END
) WITH ORDINALITY AS b(value, ordinality)
WHERE d.extracted_fields IS NOT NULL;

ALTER TABLE documents DROP COLUMN extracted_fields;

-- 3. Owner columns that only repeat the owner of the parent row are removed;
--    ownership is resolved through documents, chat_threads, document_duplicate_stacks or tags.
DROP INDEX chat_thread_documents_document_idx;
ALTER TABLE chat_thread_documents DROP COLUMN user_id;
CREATE INDEX chat_thread_documents_document_idx ON chat_thread_documents(document_id);

DROP INDEX document_embeddings_user_id_idx;
ALTER TABLE document_embeddings DROP COLUMN user_id;

DROP INDEX tag_embedding_centroids_user_id_idx;
ALTER TABLE tag_embedding_centroids DROP COLUMN user_id;

ALTER TABLE document_stack_members DROP COLUMN user_id;

DROP INDEX document_text_chunks_user_id_idx;
ALTER TABLE document_text_chunks DROP COLUMN user_id;
