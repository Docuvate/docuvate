CREATE TABLE workspace_ml_settings (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  label_auto_assign TEXT NOT NULL DEFAULT 'normal',
  label_suggestions TEXT NOT NULL DEFAULT 'normal',
  duplicate_detection TEXT NOT NULL DEFAULT 'exact',
  field_acceptance TEXT NOT NULL DEFAULT 'normal',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by_user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  CONSTRAINT workspace_ml_settings_label_auto_assign_check CHECK (
    label_auto_assign IN ('off', 'cautious', 'normal')
  ),
  CONSTRAINT workspace_ml_settings_label_suggestions_check CHECK (
    label_suggestions IN ('few', 'normal', 'many')
  ),
  CONSTRAINT workspace_ml_settings_duplicate_detection_check CHECK (
    duplicate_detection IN ('off', 'exact', 'similar')
  ),
  CONSTRAINT workspace_ml_settings_field_acceptance_check CHECK (
    field_acceptance IN ('cautious', 'normal', 'generous')
  )
);

-- Carry the previous per-user choices of the earliest installation admin into the workspace.
INSERT INTO workspace_ml_settings (tenant_id, duplicate_detection, field_acceptance)
SELECT
  t.id,
  CASE WHEN source.fuzzy_duplicate_detection_enabled THEN 'similar' ELSE 'exact' END,
  CASE
    WHEN source.label_field_confidence_threshold >= 0.70 THEN 'cautious'
    WHEN source.label_field_confidence_threshold <= 0.56 THEN 'generous'
    ELSE 'normal'
  END
FROM tenants t
LEFT JOIN LATERAL (
  SELECT p.fuzzy_duplicate_detection_enabled, p.label_field_confidence_threshold
  FROM user_preferences p
  JOIN installation_user_roles r ON r.user_id = p.user_id AND r.role = 'installation_admin'
  JOIN "user" u ON u.id = p.user_id
  ORDER BY u."createdAt" ASC
  LIMIT 1
) source ON true
WHERE t.id = '00000000-0000-4000-8000-000000000001';

ALTER TABLE user_preferences
  DROP COLUMN fuzzy_duplicate_detection_enabled,
  DROP COLUMN label_field_confidence_threshold;
