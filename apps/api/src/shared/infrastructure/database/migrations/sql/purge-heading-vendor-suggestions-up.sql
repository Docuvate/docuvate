-- Remove unconfirmed vendor suggestions that exactly match a heading block on the same document.
-- Heading rule mirrors apps/web layout overlay (bold, fontSizePt >= 11, 0 < len < 120).

WITH heading_texts AS (
  SELECT
    dli.document_id,
    trim(block_elem ->> 'text') AS heading_text
  FROM document_layout_ir dli
  CROSS JOIN LATERAL jsonb_array_elements(dli.ir -> 'pages') AS page_elem
  CROSS JOIN LATERAL jsonb_array_elements(page_elem -> 'blocks') AS block_elem
  WHERE coalesce((block_elem ->> 'fontSizePt')::double precision, 0) >= 11
    AND block_elem ->> 'weight' = 'bold'
    AND length(trim(block_elem ->> 'text')) > 0
    AND length(trim(block_elem ->> 'text')) < 120
)
DELETE FROM document_field_values v
USING heading_texts h
WHERE v.field_storage_key = 'suggestion:vendor'
  AND v.document_id = h.document_id
  AND trim(v.value_text) = h.heading_text;
