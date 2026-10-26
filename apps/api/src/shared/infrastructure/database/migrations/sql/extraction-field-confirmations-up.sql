CREATE TABLE public.extraction_field_confirmations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    document_id uuid NOT NULL,
    field_key text NOT NULL,
    field_tag_id uuid,
    confirmed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT extraction_field_confirmations_pkey PRIMARY KEY (id),
    CONSTRAINT extraction_field_confirmations_user_doc_field_uidx UNIQUE (user_id, document_id, field_key),
    CONSTRAINT extraction_field_confirmations_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE,
    CONSTRAINT extraction_field_confirmations_field_tag_id_fkey FOREIGN KEY (field_tag_id) REFERENCES public.tags(id) ON DELETE SET NULL,
    CONSTRAINT extraction_field_confirmations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE
);

CREATE INDEX extraction_field_confirmations_user_created_idx
  ON public.extraction_field_confirmations USING btree (user_id, confirmed_at DESC);

CREATE TABLE public.extraction_field_confirmation_labels (
    confirmation_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    CONSTRAINT extraction_field_confirmation_labels_pkey PRIMARY KEY (confirmation_id, tag_id),
    CONSTRAINT extraction_field_confirmation_labels_confirmation_id_fkey FOREIGN KEY (confirmation_id) REFERENCES public.extraction_field_confirmations(id) ON DELETE CASCADE,
    CONSTRAINT extraction_field_confirmation_labels_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE
);

CREATE INDEX extraction_field_confirmation_labels_tag_idx
  ON public.extraction_field_confirmation_labels USING btree (tag_id);

DELETE FROM public.extraction_field_corrections
WHERE btrim(old_value) = btrim(new_value);

DELETE FROM public.extraction_field_corrections c
USING public.extraction_field_corrections c2
WHERE c.id > c2.id
  AND c.user_id = c2.user_id
  AND c.document_id = c2.document_id
  AND c.field_key = c2.field_key
  AND c.old_value = c2.old_value
  AND c.new_value = c2.new_value;

CREATE UNIQUE INDEX extraction_field_corrections_exact_dedupe_uidx
  ON public.extraction_field_corrections (user_id, document_id, field_key, old_value, new_value);
