ALTER TABLE public.user_preferences
  DROP COLUMN IF EXISTS fuzzy_duplicate_detection_enabled;

DROP INDEX IF EXISTS public.documents_extracted_text_hash_idx;

ALTER TABLE public.documents
  DROP COLUMN IF EXISTS extracted_text_hash;
