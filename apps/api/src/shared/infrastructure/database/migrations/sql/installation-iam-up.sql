CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO tenants (id, slug)
VALUES ('00000000-0000-4000-8000-000000000001', 'default');

CREATE TABLE installation_user_roles (
  user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  CONSTRAINT installation_user_roles_role_check CHECK (
    role IN ('installation_admin', 'installation_member')
  )
);

CREATE TABLE installation_user_suspensions (
  user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  reason TEXT,
  suspended_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitee_email TEXT NOT NULL,
  invitee_name TEXT NOT NULL,
  assigned_role TEXT NOT NULL DEFAULT 'installation_member',
  invited_by_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_invitations_assigned_role_check CHECK (
    assigned_role IN ('installation_admin', 'installation_member')
  )
);

CREATE INDEX user_invitations_email_pending_idx
  ON user_invitations(lower(invitee_email))
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

CREATE UNIQUE INDEX user_invitations_token_hash_idx ON user_invitations(token_hash);

INSERT INTO installation_user_roles (user_id, role)
SELECT u.id, 'installation_admin'
FROM "user" u
WHERE NOT EXISTS (
  SELECT 1 FROM installation_user_roles r WHERE r.role = 'installation_admin'
)
ORDER BY u."createdAt" ASC
LIMIT 1
ON CONFLICT (user_id) DO NOTHING;
