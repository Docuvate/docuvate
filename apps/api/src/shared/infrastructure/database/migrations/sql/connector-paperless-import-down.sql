DROP TABLE IF EXISTS connector_paperless_field_links;
DROP TABLE IF EXISTS connector_paperless_folder_links;
DROP TABLE IF EXISTS connector_paperless_correspondent_links;
DROP TABLE IF EXISTS connector_paperless_document_type_links;
DROP TABLE IF EXISTS connector_paperless_tag_links;
DROP TABLE IF EXISTS connector_source_documents;
DROP TABLE IF EXISTS connector_import_run_errors;
DROP TABLE IF EXISTS connector_import_runs;
DROP TABLE IF EXISTS connector_paperless_settings;

ALTER TABLE documents DROP COLUMN IF EXISTS archived_storage_key;
