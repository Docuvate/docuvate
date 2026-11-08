DROP TABLE IF EXISTS public.document_page_transforms;

ALTER TABLE public.corrections
  DROP CONSTRAINT IF EXISTS corrections_kind_check;

ALTER TABLE public.corrections
  ADD CONSTRAINT corrections_kind_check
  CHECK (kind = ANY (ARRAY['label'::text, 'field'::text, 'table'::text, 'block'::text]));
