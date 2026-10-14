ALTER TABLE public.document_recognized_field_extraction_attempt
  ADD COLUMN IF NOT EXISTS extractor_version integer NOT NULL DEFAULT 0;
