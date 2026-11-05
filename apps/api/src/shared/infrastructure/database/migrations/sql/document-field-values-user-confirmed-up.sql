-- Provenance for field values: only a person's confirm/correct marks a value as confirmed.
-- Model confidence alone never does (UC12/13).
ALTER TABLE public.document_field_values
  ADD COLUMN IF NOT EXISTS user_confirmed boolean DEFAULT false NOT NULL;

-- Backfill from recorded feedback: an explicit confirmation of the field, or a user correction
-- whose new value is the value currently stored.
UPDATE public.document_field_values v
SET user_confirmed = true
FROM public.documents d
WHERE d.id = v.document_id
  AND v.user_confirmed = false
  AND (
    EXISTS (
      SELECT 1
      FROM public.extraction_field_confirmations c
      WHERE c.user_id = d.user_id
        AND c.document_id = v.document_id
        AND (
          c.field_key = v.field_storage_key
          OR (c.field_tag_id IS NOT NULL
              AND 'label:' || c.field_tag_id::text || ':' || c.field_key = v.field_storage_key)
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.extraction_field_corrections c
      WHERE c.user_id = d.user_id
        AND c.document_id = v.document_id
        AND btrim(c.new_value) = btrim(v.value_text)
        AND (
          c.field_key = v.field_storage_key
          OR (c.field_tag_id IS NOT NULL
              AND 'label:' || c.field_tag_id::text || ':' || c.field_key = v.field_storage_key)
        )
    )
  );
