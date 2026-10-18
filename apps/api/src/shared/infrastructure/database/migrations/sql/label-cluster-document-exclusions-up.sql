CREATE TABLE public.label_recommendation_cluster_exclusions (
    user_id text NOT NULL,
    label_key text NOT NULL,
    document_id uuid NOT NULL,
    excluded_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.label_recommendation_cluster_exclusions
    ADD CONSTRAINT label_recommendation_cluster_exclusions_pkey PRIMARY KEY (user_id, label_key, document_id);

ALTER TABLE ONLY public.label_recommendation_cluster_exclusions
    ADD CONSTRAINT label_recommendation_cluster_exclusions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.label_recommendation_cluster_exclusions
    ADD CONSTRAINT label_recommendation_cluster_exclusions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;

CREATE INDEX label_recommendation_cluster_exclusions_user_label_key_idx
    ON public.label_recommendation_cluster_exclusions (user_id, label_key);
