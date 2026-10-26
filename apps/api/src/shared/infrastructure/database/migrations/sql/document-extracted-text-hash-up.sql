ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS extracted_text_hash text;

UPDATE public.documents
SET extracted_text_hash = encode(
  digest(
    lower(regexp_replace(trim(extracted_text), '[[:space:]]+', ' ', 'g')),
    'sha256'
  ),
  'hex'
)
WHERE extracted_text IS NOT NULL
  AND length(trim(extracted_text)) > 0
  AND extracted_text_hash IS NULL;

CREATE INDEX IF NOT EXISTS documents_extracted_text_hash_idx
  ON public.documents USING btree (user_id, extracted_text_hash)
  WHERE extracted_text_hash IS NOT NULL;

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS fuzzy_duplicate_detection_enabled boolean NOT NULL DEFAULT false;
