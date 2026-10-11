CREATE TABLE public.corrections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    document_id uuid NOT NULL,
    kind text NOT NULL,
    created_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    withdrawn_at timestamp with time zone,
    CONSTRAINT corrections_pkey PRIMARY KEY (id),
    CONSTRAINT corrections_kind_check CHECK ((kind = ANY (ARRAY['label'::text]))),
    CONSTRAINT corrections_status_check CHECK ((status = ANY (ARRAY['active'::text, 'withdrawn'::text]))),
    CONSTRAINT corrections_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE,
    CONSTRAINT corrections_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE,
    CONSTRAINT corrections_created_by_fkey FOREIGN KEY (created_by) REFERENCES public."user"(id) ON DELETE CASCADE
);

CREATE INDEX corrections_user_created_idx ON public.corrections USING btree (user_id, created_at DESC);
CREATE INDEX corrections_document_idx ON public.corrections USING btree (document_id, created_at DESC);

CREATE TABLE public.correction_label_assignments (
    correction_id uuid NOT NULL,
    from_tag_id uuid,
    to_tag_id uuid NOT NULL,
    CONSTRAINT correction_label_assignments_pkey PRIMARY KEY (correction_id),
    CONSTRAINT correction_label_assignments_correction_id_fkey FOREIGN KEY (correction_id) REFERENCES public.corrections(id) ON DELETE CASCADE,
    CONSTRAINT correction_label_assignments_from_tag_id_fkey FOREIGN KEY (from_tag_id) REFERENCES public.tags(id) ON DELETE SET NULL,
    CONSTRAINT correction_label_assignments_to_tag_id_fkey FOREIGN KEY (to_tag_id) REFERENCES public.tags(id) ON DELETE CASCADE
);

ALTER TABLE public.embedding_density_correction
    ADD COLUMN correction_id uuid;

ALTER TABLE ONLY public.embedding_density_correction
    ADD CONSTRAINT embedding_density_correction_correction_id_fkey FOREIGN KEY (correction_id) REFERENCES public.corrections(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX embedding_density_correction_correction_id_uidx
    ON public.embedding_density_correction (correction_id)
    WHERE correction_id IS NOT NULL;

INSERT INTO public.corrections (id, user_id, document_id, kind, created_by, created_at, status)
SELECT
    edc.id,
    edc.user_id,
    edc.document_id,
    'label',
    edc.created_by,
    edc.created_at,
    CASE WHEN edc.status = 'withdrawn' THEN 'withdrawn' ELSE 'active' END
FROM public.embedding_density_correction edc;

INSERT INTO public.correction_label_assignments (correction_id, from_tag_id, to_tag_id)
SELECT edc.id, edc.from_tag_id, edc.to_tag_id
FROM public.embedding_density_correction edc;

UPDATE public.embedding_density_correction edc
SET correction_id = edc.id
WHERE correction_id IS NULL;

CREATE TABLE public.correction_propagated_assignments (
    correction_id uuid NOT NULL,
    document_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    inbox_cleared boolean NOT NULL,
    CONSTRAINT correction_propagated_assignments_pkey PRIMARY KEY (correction_id, document_id),
    CONSTRAINT correction_propagated_assignments_correction_id_fkey FOREIGN KEY (correction_id) REFERENCES public.corrections(id) ON DELETE CASCADE,
    CONSTRAINT correction_propagated_assignments_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE,
    CONSTRAINT correction_propagated_assignments_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE
);

CREATE INDEX correction_propagated_assignments_correction_idx
    ON public.correction_propagated_assignments USING btree (correction_id);
