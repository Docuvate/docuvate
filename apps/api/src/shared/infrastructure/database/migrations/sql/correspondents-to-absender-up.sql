ALTER TABLE public.recognized_field_definitions
  ADD COLUMN IF NOT EXISTS show_in_filter boolean NOT NULL DEFAULT false;

UPDATE public.recognized_field_definitions
SET show_in_filter = true
WHERE field_key = 'absender';

INSERT INTO public.recognized_field_definitions (
  user_id,
  field_key,
  label,
  field_type,
  sort_order,
  extract_for_all_documents,
  show_in_filter,
  gate_label_match
)
SELECT u.id, 'absender', 'Absender', 'text', 0, true, true, 'all'
FROM public."user" u
WHERE NOT EXISTS (
  SELECT 1
  FROM public.recognized_field_definitions r
  WHERE r.user_id = u.id AND r.field_key = 'absender'
);

CREATE TABLE IF NOT EXISTS public.saved_document_view_field_filters (
  view_id uuid NOT NULL,
  field_key text NOT NULL,
  value_text text NOT NULL,
  CONSTRAINT saved_document_view_field_filters_pkey PRIMARY KEY (view_id, field_key),
  CONSTRAINT saved_document_view_field_filters_view_id_fkey
    FOREIGN KEY (view_id) REFERENCES public.saved_document_views(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS saved_document_view_field_filters_view_idx
  ON public.saved_document_view_field_filters (view_id);

CREATE TABLE IF NOT EXISTS public.connector_paperless_absender_links (
  installation_id uuid NOT NULL,
  paperless_id integer NOT NULL,
  absender_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT connector_paperless_absender_links_pkey PRIMARY KEY (installation_id, paperless_id),
  CONSTRAINT connector_paperless_absender_links_installation_id_fkey
    FOREIGN KEY (installation_id) REFERENCES public.connector_installations(id) ON DELETE CASCADE
);

DO $$
BEGIN
  IF to_regclass('public.correspondents') IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.document_field_values (
    document_id,
    field_storage_key,
    value_text,
    confidence,
    value_text_norm,
    value_numeric,
    value_date
  )
  SELECT
    d.id,
    'global:absender',
    c.name,
    NULL,
    lower(trim(c.name)),
    NULL,
    NULL
  FROM public.documents d
  INNER JOIN public.correspondents c ON c.id = d.correspondent_id
  WHERE d.correspondent_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.document_field_values v
      WHERE v.document_id = d.id
        AND v.field_storage_key = 'global:absender'
    );

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'saved_document_views'
      AND column_name = 'correspondent_id'
  ) THEN
    INSERT INTO public.saved_document_view_field_filters (view_id, field_key, value_text)
    SELECT v.id, 'absender', c.name
    FROM public.saved_document_views v
    INNER JOIN public.correspondents c ON c.id = v.correspondent_id
    WHERE v.correspondent_id IS NOT NULL
    ON CONFLICT (view_id, field_key) DO NOTHING;

    ALTER TABLE public.saved_document_views
      DROP CONSTRAINT IF EXISTS saved_document_views_correspondent_id_fkey;

    ALTER TABLE public.saved_document_views
      DROP COLUMN IF EXISTS correspondent_id;
  END IF;

  IF to_regclass('public.connector_paperless_correspondent_links') IS NOT NULL THEN
    INSERT INTO public.connector_paperless_absender_links (installation_id, paperless_id, absender_name, created_at)
    SELECT l.installation_id, l.paperless_id, c.name, l.created_at
    FROM public.connector_paperless_correspondent_links l
    INNER JOIN public.correspondents c ON c.id = l.correspondent_id
    ON CONFLICT (installation_id, paperless_id) DO NOTHING;

    DROP TABLE public.connector_paperless_correspondent_links;
  END IF;

  ALTER TABLE public.documents
    DROP CONSTRAINT IF EXISTS documents_correspondent_id_fkey;

  ALTER TABLE public.documents
    DROP COLUMN IF EXISTS correspondent_id;

  DROP TABLE public.correspondents;
END $$;
