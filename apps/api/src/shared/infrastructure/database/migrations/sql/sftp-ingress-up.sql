CREATE TABLE IF NOT EXISTS sftp_ingress_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  username TEXT NOT NULL,
  password_hash TEXT,
  ssh_public_key TEXT,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  map_subfolders BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sftp_ingress_accounts_auth_present CHECK (
    password_hash IS NOT NULL OR ssh_public_key IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS sftp_ingress_account_labels (
  account_id UUID NOT NULL REFERENCES sftp_ingress_accounts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (account_id, tag_id)
);

CREATE INDEX IF NOT EXISTS sftp_ingress_account_labels_tag_idx
  ON sftp_ingress_account_labels (tag_id);

CREATE UNIQUE INDEX IF NOT EXISTS sftp_ingress_accounts_username_active_idx
  ON sftp_ingress_accounts (lower(username))
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS sftp_ingress_accounts_user_idx
  ON sftp_ingress_accounts (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS sftp_ingress_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES sftp_ingress_accounts(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  remote_path TEXT,
  status TEXT NOT NULL CHECK (status IN ('received', 'processed', 'rejected')),
  reason_key TEXT,
  reason_detail TEXT,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sftp_ingress_events_account_idx
  ON sftp_ingress_events (account_id, created_at DESC);

CREATE TABLE IF NOT EXISTS sftp_pull_sync_state (
  installation_id UUID PRIMARY KEY REFERENCES connector_installations(id) ON DELETE CASCADE,
  last_run_at TIMESTAMPTZ,
  last_error_key TEXT
);

CREATE TABLE IF NOT EXISTS sftp_ingress_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL,
  attempted_username TEXT,
  client_ip TEXT,
  account_id UUID REFERENCES sftp_ingress_accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sftp_ingress_audit_actor CHECK (
    account_id IS NOT NULL
    OR (attempted_username IS NOT NULL AND btrim(attempted_username) <> '')
  )
);

CREATE INDEX IF NOT EXISTS sftp_ingress_audit_created_idx
  ON sftp_ingress_audit (created_at DESC);

ALTER TABLE documents ADD COLUMN IF NOT EXISTS ingest_source TEXT;

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_ingest_source_chk;
ALTER TABLE documents ADD CONSTRAINT documents_ingest_source_chk CHECK (
  ingest_source IS NULL OR ingest_source IN ('scanner_sftp')
);

ALTER TABLE sftp_ingress_audit DROP CONSTRAINT IF EXISTS sftp_ingress_audit_kind_chk;
ALTER TABLE sftp_ingress_audit ADD CONSTRAINT sftp_ingress_audit_kind_chk CHECK (
  kind IN ('sftp.login_ok', 'sftp.login_failed', 'sftp.login_locked')
);
