ALTER TABLE documents
  ADD COLUMN archived_storage_key text;

CREATE TABLE connector_paperless_settings (
  installation_id uuid PRIMARY KEY REFERENCES connector_installations(id) ON DELETE CASCADE,
  keep_ocr_text boolean NOT NULL DEFAULT true,
  rerun_ocr boolean NOT NULL DEFAULT false,
  include_archived_pdf boolean NOT NULL DEFAULT false,
  last_successful_modified_at timestamptz
);

CREATE TABLE connector_import_runs (
  id uuid PRIMARY KEY,
  installation_id uuid NOT NULL REFERENCES connector_installations(id) ON DELETE CASCADE,
  status text NOT NULL,
  paperless_api_version integer,
  ocr_mode text NOT NULL,
  include_archived_pdf boolean NOT NULL DEFAULT false,
  progress_processed integer NOT NULL DEFAULT 0,
  progress_total integer,
  resume_page integer NOT NULL DEFAULT 1,
  resume_modified_cursor timestamptz,
  incremental_modified_gt timestamptz,
  fatal_error_key text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT connector_import_runs_status_check CHECK (
    status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])
  ),
  CONSTRAINT connector_import_runs_ocr_mode_check CHECK (
    ocr_mode = ANY (ARRAY['keep_paperless'::text, 'rerun_docuvate'::text])
  )
);

CREATE INDEX connector_import_runs_installation_idx ON connector_import_runs(installation_id, created_at DESC);

CREATE UNIQUE INDEX connector_import_runs_one_active_per_installation_idx
  ON connector_import_runs (installation_id)
  WHERE status IN ('pending', 'running');

CREATE TABLE connector_import_run_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES connector_import_runs(id) ON DELETE CASCADE,
  source_document_id text NOT NULL,
  message_key text NOT NULL,
  message_detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX connector_import_run_errors_run_idx ON connector_import_run_errors(run_id, created_at);

CREATE TABLE connector_source_documents (
  installation_id uuid NOT NULL REFERENCES connector_installations(id) ON DELETE CASCADE,
  source_document_id text NOT NULL,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content_checksum text NOT NULL,
  source_modified_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (installation_id, source_document_id)
);

CREATE INDEX connector_source_documents_document_idx ON connector_source_documents(document_id);

CREATE TABLE connector_paperless_tag_links (
  installation_id uuid NOT NULL REFERENCES connector_installations(id) ON DELETE CASCADE,
  paperless_id integer NOT NULL,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (installation_id, paperless_id)
);

CREATE TABLE connector_paperless_document_type_links (
  installation_id uuid NOT NULL REFERENCES connector_installations(id) ON DELETE CASCADE,
  paperless_id integer NOT NULL,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (installation_id, paperless_id)
);

CREATE TABLE connector_paperless_correspondent_links (
  installation_id uuid NOT NULL REFERENCES connector_installations(id) ON DELETE CASCADE,
  paperless_id integer NOT NULL,
  correspondent_id uuid NOT NULL REFERENCES correspondents(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (installation_id, paperless_id)
);

CREATE TABLE connector_paperless_folder_links (
  installation_id uuid NOT NULL REFERENCES connector_installations(id) ON DELETE CASCADE,
  paperless_id integer NOT NULL,
  folder_id uuid NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (installation_id, paperless_id)
);

CREATE TABLE connector_paperless_field_links (
  installation_id uuid NOT NULL REFERENCES connector_installations(id) ON DELETE CASCADE,
  paperless_id integer NOT NULL,
  field_definition_id uuid NOT NULL REFERENCES recognized_field_definitions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (installation_id, paperless_id)
);
