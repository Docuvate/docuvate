ALTER TABLE chat_threads DROP CONSTRAINT IF EXISTS chat_threads_scope_check;
UPDATE chat_threads SET scope = 'corpus' WHERE scope = 'library';
ALTER TABLE chat_threads
  ADD CONSTRAINT chat_threads_scope_check
  CHECK (scope = ANY (ARRAY['document'::text, 'corpus'::text]));

DROP INDEX IF EXISTS chat_message_citations_chunk_id_idx;
DROP TABLE IF EXISTS chat_message_citations;

ALTER TABLE document_text_chunks
  DROP COLUMN IF EXISTS page,
  DROP COLUMN IF EXISTS char_start,
  DROP COLUMN IF EXISTS char_end;
