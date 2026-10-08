DROP TRIGGER IF EXISTS document_text_chunks_search_vector_trigger ON document_text_chunks;
DROP FUNCTION IF EXISTS document_text_chunks_search_vector_update();

DROP TABLE IF EXISTS document_field_values;
DROP TABLE IF EXISTS search_vocabulary_terms;
DROP TABLE IF EXISTS document_text_chunks;

DROP INDEX IF EXISTS documents_title_trgm_idx;
DROP INDEX IF EXISTS documents_filename_trgm_idx;
DROP INDEX IF EXISTS folders_name_trgm_idx;
DROP INDEX IF EXISTS tags_name_trgm_idx;
