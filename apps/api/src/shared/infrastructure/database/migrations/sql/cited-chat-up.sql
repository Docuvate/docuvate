-- Cited document chat (ADR 024): chunk offsets, message citations, library scope.
ALTER TABLE document_text_chunks
  ADD COLUMN IF NOT EXISTS page integer,
  ADD COLUMN IF NOT EXISTS char_start integer,
  ADD COLUMN IF NOT EXISTS char_end integer;

CREATE TABLE IF NOT EXISTS chat_message_citations (
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  chunk_id uuid NOT NULL REFERENCES document_text_chunks(id) ON DELETE CASCADE,
  ordinal integer NOT NULL,
  quote text NOT NULL,
  char_start integer NOT NULL,
  char_end integer NOT NULL,
  PRIMARY KEY (message_id, ordinal)
);

CREATE INDEX IF NOT EXISTS chat_message_citations_chunk_id_idx ON chat_message_citations(chunk_id);

ALTER TABLE chat_threads DROP CONSTRAINT IF EXISTS chat_threads_scope_check;
UPDATE chat_threads SET scope = 'library' WHERE scope = 'corpus';
ALTER TABLE chat_threads
  ADD CONSTRAINT chat_threads_scope_check
  CHECK (scope = ANY (ARRAY['document'::text, 'library'::text]));
