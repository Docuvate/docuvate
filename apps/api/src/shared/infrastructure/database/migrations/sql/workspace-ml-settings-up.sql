
-- Carry the previous per-user choices of the earliest installation admin into the workspace.
-- Skipped when the schema is already migrated (baseline stamping re-runs this migration).
DO $$
BEGIN
  IF (
    SELECT count(*)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_preferences'
      AND column_name IN ('fuzzy_duplicate_detection_enabled', 'label_field_confidence_threshold')
  ) = 2 THEN
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
    WHERE t.id = '00000000-0000-4000-8000-000000000001'
    ON CONFLICT (tenant_id) DO NOTHING;
  END IF;
END
$$;

ALTER TABLE user_preferences
  DROP COLUMN IF EXISTS fuzzy_duplicate_detection_enabled,
  DROP COLUMN IF EXISTS label_field_confidence_threshold;
