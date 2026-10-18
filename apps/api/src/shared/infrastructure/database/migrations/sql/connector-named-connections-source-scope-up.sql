ALTER TABLE connector_installations
  DROP CONSTRAINT IF EXISTS connector_installations_user_id_plugin_id_key;

CREATE UNIQUE INDEX connector_installations_user_display_name_key
  ON connector_installations (user_id, lower(btrim(display_name)));

CREATE TABLE connector_installation_source_scope (
  installation_id uuid NOT NULL,
  mode text NOT NULL,
  CONSTRAINT connector_installation_source_scope_mode_check
    CHECK (mode IN ('all', 'selected')),
  CONSTRAINT connector_installation_source_scope_pkey PRIMARY KEY (installation_id),
  CONSTRAINT connector_installation_source_scope_installation_id_fkey
    FOREIGN KEY (installation_id) REFERENCES connector_installations(id) ON DELETE CASCADE
);

CREATE TABLE connector_installation_source_paths (
  installation_id uuid NOT NULL,
  path text NOT NULL,
  CONSTRAINT connector_installation_source_paths_pkey PRIMARY KEY (installation_id, path),
  CONSTRAINT connector_installation_source_paths_installation_id_fkey
    FOREIGN KEY (installation_id) REFERENCES connector_installations(id) ON DELETE CASCADE
);

INSERT INTO connector_installation_source_scope (installation_id, mode)
SELECT id, 'all'
FROM connector_installations
ON CONFLICT (installation_id) DO NOTHING;
