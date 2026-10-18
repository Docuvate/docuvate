DROP TABLE IF EXISTS connector_installation_source_paths;
DROP TABLE IF EXISTS connector_installation_source_scope;

DROP INDEX IF EXISTS connector_installations_user_display_name_key;

CREATE UNIQUE INDEX connector_installations_user_id_plugin_id_key
  ON connector_installations (user_id, plugin_id);
