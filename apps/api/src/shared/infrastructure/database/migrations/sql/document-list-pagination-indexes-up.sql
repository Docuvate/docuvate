CREATE INDEX IF NOT EXISTS idx_documents_user_updated_id
  ON documents (user_id, updated_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_documents_user_created_id
  ON documents (user_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_documents_user_title_id
  ON documents (user_id, title ASC, id ASC);

CREATE INDEX IF NOT EXISTS idx_documents_user_document_date_id
  ON documents (user_id, document_date DESC NULLS LAST, id DESC);
