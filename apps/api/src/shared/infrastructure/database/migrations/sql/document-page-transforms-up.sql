-- Per-page non-destructive orientation. Stored coordinates stay in unrotated MediaBox space.
-- rotation_quarter_turns: clockwise quarter turns from the source page (0..3).
-- deskew_deg reserved for small angles; not applied in this migration's consumers yet.
ALTER TABLE public.corrections
  DROP CONSTRAINT IF EXISTS corrections_kind_check;

ALTER TABLE public.corrections
  ADD CONSTRAINT corrections_kind_check
  CHECK (kind = ANY (ARRAY['label'::text, 'field'::text, 'table'::text, 'block'::text, 'page'::text]));

CREATE TABLE IF NOT EXISTS public.document_page_transforms (
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  page integer NOT NULL CHECK (page >= 1),
  rotation_quarter_turns smallint NOT NULL DEFAULT 0 CHECK (rotation_quarter_turns >= 0 AND rotation_quarter_turns <= 3),
  deskew_deg real NOT NULL DEFAULT 0 CHECK (deskew_deg >= -15 AND deskew_deg <= 15),
  source text NOT NULL DEFAULT 'user' CHECK (source IN ('user', 'pipeline')),
  correction_id uuid REFERENCES public.corrections(id) ON DELETE SET NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY (document_id, page)
);

CREATE INDEX IF NOT EXISTS document_page_transforms_correction_idx
  ON public.document_page_transforms (correction_id)
  WHERE correction_id IS NOT NULL;
