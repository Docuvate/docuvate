DROP TABLE IF EXISTS public.extraction_field_feedback_position_tokens;
DROP TABLE IF EXISTS public.extraction_field_feedback_positions;

-- Keep confirmed values recoverable through value_sha256 before dropping the text.
UPDATE public.extraction_field_confirmations
SET value_sha256 = digest(convert_to(value_text, 'UTF8'), 'sha256')
WHERE value_text IS NOT NULL AND value_sha256 IS NULL;

DROP INDEX IF EXISTS public.extraction_field_confirmations_field_name_idx;
DROP INDEX IF EXISTS public.extraction_field_corrections_field_name_idx;
ALTER TABLE public.extraction_field_confirmations DROP COLUMN IF EXISTS value_text;
ALTER TABLE public.extraction_field_confirmations DROP COLUMN IF EXISTS field_name_id;
ALTER TABLE public.extraction_field_corrections DROP COLUMN IF EXISTS field_name_id;
DROP TABLE IF EXISTS public.extraction_field_names;
