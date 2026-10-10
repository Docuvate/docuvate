-- Reclassify heuristic vendor/amount/date rows as suggestion:* when not in the user catalog.

DELETE FROM document_field_values heuristic_row
USING documents d
WHERE heuristic_row.document_id = d.id
  AND heuristic_row.field_storage_key IN ('vendor', 'global:vendor', 'amount', 'global:amount', 'date', 'global:date')
  AND (heuristic_row.confidence IS NULL OR heuristic_row.confidence <= 0.55)
  AND EXISTS (
    SELECT 1
    FROM document_field_values newer
    WHERE newer.document_id = heuristic_row.document_id
      AND newer.field_storage_key = CASE heuristic_row.field_storage_key
        WHEN 'vendor' THEN 'suggestion:vendor'
        WHEN 'global:vendor' THEN 'suggestion:vendor'
        WHEN 'amount' THEN 'suggestion:amount'
        WHEN 'global:amount' THEN 'suggestion:amount'
        WHEN 'date' THEN 'suggestion:date'
        WHEN 'global:date' THEN 'suggestion:date'
      END
  );

UPDATE document_field_values v
SET field_storage_key = CASE v.field_storage_key
  WHEN 'vendor' THEN 'suggestion:vendor'
  WHEN 'global:vendor' THEN 'suggestion:vendor'
  WHEN 'amount' THEN 'suggestion:amount'
  WHEN 'global:amount' THEN 'suggestion:amount'
  WHEN 'date' THEN 'suggestion:date'
  WHEN 'global:date' THEN 'suggestion:date'
  ELSE v.field_storage_key
END
FROM documents d
WHERE v.document_id = d.id
  AND v.field_storage_key IN (
    'vendor',
    'global:vendor',
    'amount',
    'global:amount',
    'date',
    'global:date'
  )
  AND (v.confidence IS NULL OR v.confidence <= 0.55)
  AND NOT EXISTS (
    SELECT 1
    FROM recognized_field_definitions r
    WHERE r.user_id = d.user_id
      AND lower(r.field_key) = CASE v.field_storage_key
        WHEN 'vendor' THEN 'vendor'
        WHEN 'global:vendor' THEN 'vendor'
        WHEN 'amount' THEN 'amount'
        WHEN 'global:amount' THEN 'amount'
        WHEN 'date' THEN 'date'
        WHEN 'global:date' THEN 'date'
      END
  );
