-- One canonical field name per user. Feedback rows reference it instead of
-- repeating storage-key spellings (suggestion:*, global:*, label:<uuid>:*, plain).
CREATE TABLE IF NOT EXISTS public.extraction_field_names (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id text NOT NULL,
  name text NOT NULL,
  CONSTRAINT extraction_field_names_pkey PRIMARY KEY (id),
  CONSTRAINT extraction_field_names_user_name_uidx UNIQUE (user_id, name),
  CONSTRAINT extraction_field_names_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE
);

-- Mirrors canonicalFieldName() in @docuvate/contracts (structural prefix parsing, no value inspection).
DROP TABLE IF EXISTS pg_temp.extraction_field_name_backfill;
CREATE TEMPORARY TABLE extraction_field_name_backfill AS
WITH keys AS (
  SELECT user_id, field_key FROM public.extraction_field_corrections
  UNION
  SELECT user_id, field_key FROM public.extraction_field_confirmations
),
unsuggested AS (
  SELECT user_id, field_key,
    CASE WHEN btrim(field_key) ~* '^suggestion:[a-z0-9_]+$'
      THEN substr(btrim(field_key), 12) ELSE field_key END AS key1
  FROM keys
),
based AS (
  SELECT user_id, field_key,
    CASE
      WHEN key1 ~* '^global:[a-z0-9_]+$' THEN substr(key1, 8)
      WHEN key1 ~* '^label:[0-9a-f-]{36}:.+$' THEN substr(key1, 44)
      ELSE key1
    END AS base
  FROM unsuggested
),
normalized AS (
  SELECT user_id, field_key, regexp_replace(lower(btrim(base)), '[_-]+', '', 'g') AS norm
  FROM based
)
SELECT n.user_id, n.field_key, COALESCE(a.canonical, n.norm) AS name
FROM normalized n
LEFT JOIN (VALUES
  ('date', 'date'), ('datum', 'date'), ('documentdate', 'date'),
  ('vendor', 'vendor'), ('absender', 'vendor'), ('supplier', 'vendor'), ('lieferant', 'vendor'),
  ('amount', 'amount'), ('betrag', 'amount'), ('total', 'amount'), ('summe', 'amount'),
  ('iban', 'iban'),
  ('reference', 'reference'), ('verwendungszweck', 'reference'),
  ('invoicenumber', 'invoicenumber'), ('rechnungsnummer', 'invoicenumber')
) AS a(alias, canonical) ON a.alias = n.norm;

INSERT INTO public.extraction_field_names (user_id, name)
SELECT DISTINCT user_id, name FROM extraction_field_name_backfill
ON CONFLICT (user_id, name) DO NOTHING;

ALTER TABLE public.extraction_field_corrections
  ADD COLUMN IF NOT EXISTS field_name_id uuid
    REFERENCES public.extraction_field_names(id) ON DELETE RESTRICT;
ALTER TABLE public.extraction_field_confirmations
  ADD COLUMN IF NOT EXISTS field_name_id uuid
    REFERENCES public.extraction_field_names(id) ON DELETE RESTRICT;
ALTER TABLE public.extraction_field_confirmations
  ADD COLUMN IF NOT EXISTS value_text text;

UPDATE public.extraction_field_corrections c
SET field_name_id = n.id
FROM extraction_field_name_backfill b
JOIN public.extraction_field_names n ON n.user_id = b.user_id AND n.name = b.name
WHERE c.field_name_id IS NULL AND b.user_id = c.user_id AND b.field_key = c.field_key;

UPDATE public.extraction_field_confirmations c
SET field_name_id = n.id
FROM extraction_field_name_backfill b
JOIN public.extraction_field_names n ON n.user_id = b.user_id AND n.name = b.name
WHERE c.field_name_id IS NULL AND b.user_id = c.user_id AND b.field_key = c.field_key;

DROP TABLE pg_temp.extraction_field_name_backfill;

ALTER TABLE public.extraction_field_corrections ALTER COLUMN field_name_id SET NOT NULL;
ALTER TABLE public.extraction_field_confirmations ALTER COLUMN field_name_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS extraction_field_corrections_field_name_idx
  ON public.extraction_field_corrections (field_name_id);
CREATE INDEX IF NOT EXISTS extraction_field_confirmations_field_name_idx
  ON public.extraction_field_confirmations (field_name_id);

-- Where the confirmed or corrected value sits on the page. Absent row = no known position.
CREATE TABLE IF NOT EXISTS public.extraction_field_feedback_positions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  confirmation_id uuid,
  correction_id uuid,
  source text NOT NULL,
  page integer NOT NULL,
  doc_char_start integer,
  doc_char_end integer,
  x0 real,
  y0 real,
  x1 real,
  y1 real,
  CONSTRAINT extraction_field_feedback_positions_pkey PRIMARY KEY (id),
  CONSTRAINT extraction_field_feedback_positions_confirmation_uidx UNIQUE (confirmation_id),
  CONSTRAINT extraction_field_feedback_positions_correction_uidx UNIQUE (correction_id),
  CONSTRAINT extraction_field_feedback_positions_confirmation_fkey FOREIGN KEY (confirmation_id)
    REFERENCES public.extraction_field_confirmations(id) ON DELETE CASCADE,
  CONSTRAINT extraction_field_feedback_positions_correction_fkey FOREIGN KEY (correction_id)
    REFERENCES public.extraction_field_corrections(id) ON DELETE CASCADE,
  CONSTRAINT extraction_field_feedback_positions_owner_check
    CHECK (num_nonnulls(confirmation_id, correction_id) = 1),
  CONSTRAINT extraction_field_feedback_positions_source_check
    CHECK (source IN ('model_fact', 'user_region')),
  CONSTRAINT extraction_field_feedback_positions_page_check CHECK (page >= 1),
  CONSTRAINT extraction_field_feedback_positions_chars_check CHECK (
    num_nulls(doc_char_start, doc_char_end) IN (0, 2)
    AND (doc_char_start IS NULL OR (0 <= doc_char_start AND doc_char_start < doc_char_end))
  ),
  CONSTRAINT extraction_field_feedback_positions_bbox_check CHECK (
    num_nulls(x0, y0, x1, y1) IN (0, 4)
    AND (x0 IS NULL OR (0 <= x0 AND x0 < x1 AND x1 <= 1 AND 0 <= y0 AND y0 < y1 AND y1 <= 1))
  ),
  CONSTRAINT extraction_field_feedback_positions_anchor_check
    CHECK (doc_char_start IS NOT NULL OR x0 IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.extraction_field_feedback_position_tokens (
  position_id uuid NOT NULL,
  block_index integer NOT NULL,
  CONSTRAINT extraction_field_feedback_position_tokens_pkey PRIMARY KEY (position_id, block_index),
  CONSTRAINT extraction_field_feedback_position_tokens_position_fkey FOREIGN KEY (position_id)
    REFERENCES public.extraction_field_feedback_positions(id) ON DELETE CASCADE,
  CONSTRAINT extraction_field_feedback_position_tokens_block_check CHECK (block_index >= 0)
);
