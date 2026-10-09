CREATE TABLE IF NOT EXISTS document_layout_ir (
  document_id uuid PRIMARY KEY REFERENCES documents (id) ON DELETE CASCADE,
  version smallint NOT NULL CHECK (version >= 1),
  ir jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_layout_ir_pages (
  document_id uuid NOT NULL REFERENCES document_layout_ir (document_id) ON DELETE CASCADE,
  page integer NOT NULL CHECK (page >= 1),
  width_pt double precision NOT NULL,
  height_pt double precision NOT NULL,
  PRIMARY KEY (document_id, page)
);
