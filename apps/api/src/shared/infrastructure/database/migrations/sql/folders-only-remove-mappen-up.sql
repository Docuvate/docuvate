-- Reversible migration: Mappen become top-level folders; drop mappe_id and mappen table.

CREATE TABLE IF NOT EXISTS _rev_mappen AS TABLE mappen;

CREATE TABLE IF NOT EXISTS _rev_folders_mappe_state AS
SELECT id, user_id, parent_id, mappe_id, name
FROM folders
WHERE mappe_id IS NOT NULL OR id IN (SELECT id FROM mappen);

CREATE TABLE IF NOT EXISTS _rev_documents_mappe_state AS
SELECT id, user_id, folder_id, mappe_id
FROM documents
WHERE mappe_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS _rev_saved_views_mappe_state AS
SELECT id, owner_user_id, list_scope, folder_id, mappe_id
FROM saved_document_views
WHERE mappe_id IS NOT NULL OR list_scope = 'mappe';

-- Each Mappe becomes a root folder (reuse Mappe UUID as folder id).
INSERT INTO folders (id, user_id, name, parent_id, mappe_id, created_at, updated_at)
SELECT m.id,
       m.user_id,
       CASE
         WHEN EXISTS (
           SELECT 1
           FROM folders f0
           WHERE f0.user_id = m.user_id
             AND f0.parent_id IS NULL
             AND f0.id <> m.id
             AND f0.name = m.name
         )
         THEN m.name || ' (' || LEFT(m.id::text, 8) || ')'
         ELSE m.name
       END,
       NULL,
       NULL,
       m.created_at,
       m.updated_at
FROM mappen m
ON CONFLICT (id) DO NOTHING;

-- Former mappe-root folders become children of the mappe-as-folder node.
UPDATE folders f
SET parent_id = f.mappe_id,
    updated_at = now()
WHERE f.mappe_id IS NOT NULL
  AND f.parent_id IS NULL
  AND f.id <> f.mappe_id;

UPDATE folders
SET mappe_id = NULL,
    updated_at = now()
WHERE mappe_id IS NOT NULL;

UPDATE documents d
SET folder_id = d.mappe_id,
    mappe_id = NULL,
    updated_at = now()
WHERE d.mappe_id IS NOT NULL
  AND d.folder_id IS NULL;

UPDATE saved_document_views
SET list_scope = 'folder',
    folder_id = COALESCE(folder_id, mappe_id),
    mappe_id = NULL,
    updated_at = now()
WHERE list_scope = 'mappe'
   OR mappe_id IS NOT NULL;

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_folder_or_mappe_exclusive;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_mappe_id_fkey;
DROP INDEX IF EXISTS documents_mappe_id_idx;
ALTER TABLE documents DROP COLUMN IF EXISTS mappe_id;

ALTER TABLE folders DROP CONSTRAINT IF EXISTS folders_mappe_id_fkey;
DROP INDEX IF EXISTS folders_mappe_id_idx;
ALTER TABLE folders DROP COLUMN IF EXISTS mappe_id;

ALTER TABLE saved_document_views DROP CONSTRAINT IF EXISTS saved_document_views_mappe_id_fkey;
ALTER TABLE saved_document_views DROP COLUMN IF EXISTS mappe_id;

ALTER TABLE saved_document_views DROP CONSTRAINT IF EXISTS saved_document_views_list_scope_check;
ALTER TABLE saved_document_views
  ADD CONSTRAINT saved_document_views_list_scope_check
  CHECK (list_scope = ANY (ARRAY['all'::text, 'folder'::text]));

ALTER TABLE folders DROP CONSTRAINT IF EXISTS folders_user_id_parent_id_name_key;

CREATE UNIQUE INDEX folders_user_id_root_name_key
  ON folders (user_id, name)
  WHERE parent_id IS NULL;

CREATE UNIQUE INDEX folders_user_id_parent_name_key
  ON folders (user_id, parent_id, name)
  WHERE parent_id IS NOT NULL;

DROP TABLE IF EXISTS mappen;
