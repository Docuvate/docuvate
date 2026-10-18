-- Restore Mappen schema and data from _rev_* backup tables (when present).

CREATE TABLE IF NOT EXISTS mappen (
    id uuid NOT NULL,
    user_id text NOT NULL,
    name text NOT NULL,
    color text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY mappen ADD CONSTRAINT mappen_pkey PRIMARY KEY (id);
ALTER TABLE ONLY mappen ADD CONSTRAINT mappen_user_id_name_key UNIQUE (user_id, name);
CREATE INDEX IF NOT EXISTS mappen_user_id_idx ON mappen USING btree (user_id);

INSERT INTO mappen (id, user_id, name, color, created_at, updated_at)
SELECT id, user_id, name, NULL, created_at, updated_at
FROM _rev_mappen
ON CONFLICT (id) DO NOTHING;

ALTER TABLE folders ADD COLUMN IF NOT EXISTS mappe_id uuid;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS mappe_id uuid;
ALTER TABLE saved_document_views ADD COLUMN IF NOT EXISTS mappe_id uuid;

UPDATE folders f
SET parent_id = s.parent_id,
    mappe_id = s.mappe_id,
    updated_at = now()
FROM _rev_folders_mappe_state s
WHERE f.id = s.id;

UPDATE documents d
SET folder_id = s.folder_id,
    mappe_id = s.mappe_id,
    updated_at = now()
FROM _rev_documents_mappe_state s
WHERE d.id = s.id;

UPDATE saved_document_views v
SET list_scope = s.list_scope,
    folder_id = s.folder_id,
    mappe_id = s.mappe_id,
    updated_at = now()
FROM _rev_saved_views_mappe_state s
WHERE v.id = s.id;

DELETE FROM folders f
WHERE f.id IN (SELECT id FROM _rev_mappen)
  AND NOT EXISTS (SELECT 1 FROM _rev_folders_mappe_state s WHERE s.id = f.id);

ALTER TABLE documents
  ADD CONSTRAINT documents_folder_or_mappe_exclusive
  CHECK (NOT ((folder_id IS NOT NULL) AND (mappe_id IS NOT NULL)));

CREATE INDEX IF NOT EXISTS documents_mappe_id_idx ON documents USING btree (mappe_id);
ALTER TABLE ONLY documents
  ADD CONSTRAINT documents_mappe_id_fkey FOREIGN KEY (mappe_id) REFERENCES mappen(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS folders_mappe_id_idx ON folders USING btree (mappe_id);
ALTER TABLE ONLY folders
  ADD CONSTRAINT folders_mappe_id_fkey FOREIGN KEY (mappe_id) REFERENCES mappen(id) ON DELETE SET NULL;

ALTER TABLE saved_document_views DROP CONSTRAINT IF EXISTS saved_document_views_list_scope_check;
ALTER TABLE saved_document_views
  ADD CONSTRAINT saved_document_views_list_scope_check
  CHECK (list_scope = ANY (ARRAY['all'::text, 'folder'::text, 'mappe'::text]));

ALTER TABLE ONLY saved_document_views
  ADD CONSTRAINT saved_document_views_mappe_id_fkey FOREIGN KEY (mappe_id) REFERENCES mappen(id) ON DELETE SET NULL;

DROP INDEX IF EXISTS folders_user_id_root_name_key;
DROP INDEX IF EXISTS folders_user_id_parent_name_key;

ALTER TABLE folders DROP CONSTRAINT IF EXISTS folders_user_id_parent_id_name_key;
ALTER TABLE ONLY folders
  ADD CONSTRAINT folders_user_id_parent_id_name_key UNIQUE (user_id, parent_id, name);
