-- Down path: renames every suggestion:vendor/amount/date row, including worker-written
-- suggestions after #37, not only rows touched by the up migration.
UPDATE document_field_values v
SET field_storage_key = CASE v.field_storage_key
  WHEN 'suggestion:vendor' THEN 'vendor'
  WHEN 'suggestion:amount' THEN 'amount'
  WHEN 'suggestion:date' THEN 'date'
  ELSE v.field_storage_key
END
WHERE v.field_storage_key IN ('suggestion:vendor', 'suggestion:amount', 'suggestion:date');
