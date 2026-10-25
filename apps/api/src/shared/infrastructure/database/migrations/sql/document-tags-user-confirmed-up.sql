ALTER TABLE public.document_tags
  ADD COLUMN IF NOT EXISTS user_confirmed boolean;

UPDATE public.document_tags
SET user_confirmed = true
WHERE user_confirmed IS NULL;

ALTER TABLE public.document_tags
  ALTER COLUMN user_confirmed SET DEFAULT false,
  ALTER COLUMN user_confirmed SET NOT NULL;
