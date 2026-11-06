-- Durable per-document field-suggestion decisions (reject without wiping OCR/regions).
-- 3NF: one row per (document, field_key, normalized value) decision; linked to a correction for undo.
CREATE TABLE IF NOT EXISTS public.document_field_suggestion_decisions (
  id uuid PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  field_key text NOT NULL,
  value_raw text NOT NULL,
  value_normalized text NOT NULL,
  decision text NOT NULL CHECK (decision = 'rejected'),
  correction_id uuid NOT NULL REFERENCES public.corrections(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  withdrawn_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS document_field_suggestion_decisions_active_uidx
  ON public.document_field_suggestion_decisions (document_id, field_key, value_normalized)
  WHERE withdrawn_at IS NULL AND decision = 'rejected';

CREATE INDEX IF NOT EXISTS document_field_suggestion_decisions_document_idx
  ON public.document_field_suggestion_decisions (document_id)
  WHERE withdrawn_at IS NULL;

CREATE INDEX IF NOT EXISTS document_field_suggestion_decisions_correction_idx
  ON public.document_field_suggestion_decisions (correction_id);
