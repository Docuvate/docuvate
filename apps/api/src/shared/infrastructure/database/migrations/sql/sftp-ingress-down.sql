ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_ingest_source_chk;
ALTER TABLE sftp_ingress_audit DROP CONSTRAINT IF EXISTS sftp_ingress_audit_kind_chk;

ALTER TABLE documents DROP COLUMN IF EXISTS ingest_source;

DROP TABLE IF EXISTS sftp_ingress_audit;
DROP TABLE IF EXISTS sftp_pull_sync_state;
DROP TABLE IF EXISTS sftp_ingress_events;
DROP TABLE IF EXISTS sftp_ingress_account_labels;
DROP TABLE IF EXISTS sftp_ingress_accounts;
