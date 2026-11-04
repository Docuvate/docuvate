ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS label_field_confidence_threshold REAL NOT NULL DEFAULT 0.62,
  ADD COLUMN IF NOT EXISTS fuzzy_duplicate_detection_enabled BOOLEAN NOT NULL DEFAULT false;

UPDATE user_preferences
SET
  fuzzy_duplicate_detection_enabled = (w.duplicate_detection = 'similar'),
  label_field_confidence_threshold = CASE w.field_acceptance
    WHEN 'cautious' THEN 0.75
    WHEN 'generous' THEN 0.50
    ELSE 0.62
  END
FROM workspace_ml_settings w
WHERE w.tenant_id = '00000000-0000-4000-8000-000000000001';

DROP TABLE IF EXISTS workspace_ml_settings;
