DROP INDEX IF EXISTS public.documents_extracted_text_hash_idx;

ALTER TABLE public.documents
  DROP COLUMN IF EXISTS extracted_text_hash;
