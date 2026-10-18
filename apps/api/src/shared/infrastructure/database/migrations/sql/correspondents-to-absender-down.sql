CREATE TABLE public.correspondents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  matching_algorithm text DEFAULT 'none'::text NOT NULL,
  match_text text DEFAULT ''::text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT correspondents_pkey PRIMARY KEY (id),
  CONSTRAINT correspondents_user_id_name_key UNIQUE (user_id, name),
  CONSTRAINT correspondents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE
);

INSERT INTO public.correspondents (id, user_id, name)
SELECT gen_random_uuid(), names.user_id, names.name
FROM (
  SELECT DISTINCT doc.user_id, trim(v.value_text) AS name
  FROM public.document_field_values v
  INNER JOIN public.documents doc ON doc.id = v.document_id
  WHERE v.field_storage_key = 'global:absender'
    AND trim(v.value_text) <> ''
  UNION
  SELECT DISTINCT sv.owner_user_id, trim(f.value_text) AS name
  FROM public.saved_document_view_field_filters f
  INNER JOIN public.saved_document_views sv ON sv.id = f.view_id
  WHERE f.field_key = 'absender'
    AND trim(f.value_text) <> ''
  UNION
  SELECT DISTINCT ci.user_id, trim(l.absender_name) AS name
  FROM public.connector_paperless_absender_links l
  INNER JOIN public.connector_installations ci ON ci.id = l.installation_id
  WHERE trim(l.absender_name) <> ''
) names
ON CONFLICT (user_id, name) DO NOTHING;

ALTER TABLE public.documents
  ADD COLUMN correspondent_id uuid;

UPDATE public.documents d
SET correspondent_id = c.id
FROM public.document_field_values v,
     public.correspondents c
WHERE v.document_id = d.id
  AND v.field_storage_key = 'global:absender'
  AND trim(v.value_text) <> ''
  AND c.user_id = d.user_id
  AND c.name = trim(v.value_text);

ALTER TABLE public.documents
  ADD CONSTRAINT documents_correspondent_id_fkey
    FOREIGN KEY (correspondent_id) REFERENCES public.correspondents(id) ON DELETE SET NULL;

CREATE TABLE public.connector_paperless_correspondent_links (
  installation_id uuid NOT NULL,
  paperless_id integer NOT NULL,
  correspondent_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT connector_paperless_correspondent_links_pkey PRIMARY KEY (installation_id, paperless_id),
  CONSTRAINT connector_paperless_correspondent_links_installation_id_fkey
    FOREIGN KEY (installation_id) REFERENCES public.connector_installations(id) ON DELETE CASCADE,
  CONSTRAINT connector_paperless_correspondent_links_correspondent_id_fkey
    FOREIGN KEY (correspondent_id) REFERENCES public.correspondents(id) ON DELETE CASCADE
);

INSERT INTO public.connector_paperless_correspondent_links (
  installation_id,
  paperless_id,
  correspondent_id,
  created_at
)
SELECT
  l.installation_id,
  l.paperless_id,
  c.id,
  l.created_at
FROM public.connector_paperless_absender_links l
INNER JOIN public.connector_installations ci ON ci.id = l.installation_id
INNER JOIN public.correspondents c
  ON c.user_id = ci.user_id
 AND c.name = trim(l.absender_name);

DROP TABLE public.connector_paperless_absender_links;

ALTER TABLE public.saved_document_views
  ADD COLUMN correspondent_id uuid;

UPDATE public.saved_document_views v
SET correspondent_id = c.id
FROM public.saved_document_view_field_filters f,
     public.correspondents c
WHERE f.view_id = v.id
  AND f.field_key = 'absender'
  AND trim(f.value_text) <> ''
  AND c.user_id = v.owner_user_id
  AND c.name = trim(f.value_text);

ALTER TABLE public.saved_document_views
  ADD CONSTRAINT saved_document_views_correspondent_id_fkey
    FOREIGN KEY (correspondent_id) REFERENCES public.correspondents(id) ON DELETE SET NULL;

DROP TABLE public.saved_document_view_field_filters;

ALTER TABLE public.recognized_field_definitions
  DROP COLUMN IF EXISTS show_in_filter;
