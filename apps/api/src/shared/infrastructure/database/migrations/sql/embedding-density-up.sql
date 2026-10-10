-- Embedding-density model state (NIW-Student-t over document embeddings)

INSERT INTO ml_model_families (id, kind, display_name, description)
VALUES (
  'layout-niw',
  'embedding',
  'Embedding density (NIW)',
  'Calibrated NIW-Student-t class densities over document embeddings'
)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.embedding_density_calibration_run (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    model_version_id uuid,
    n_documents integer NOT NULL,
    n_examples integer NOT NULL,
    delta real NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT embedding_density_calibration_run_pkey PRIMARY KEY (id),
    CONSTRAINT embedding_density_calibration_run_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE,
    CONSTRAINT embedding_density_calibration_run_model_version_id_fkey FOREIGN KEY (model_version_id) REFERENCES public.ml_model_versions(id) ON DELETE SET NULL
);

CREATE TABLE public.embedding_density_label_group (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    calibration_run_id uuid NOT NULL,
    name text NOT NULL,
    CONSTRAINT embedding_density_label_group_pkey PRIMARY KEY (id),
    CONSTRAINT embedding_density_label_group_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE,
    CONSTRAINT embedding_density_label_group_calibration_run_id_fkey FOREIGN KEY (calibration_run_id) REFERENCES public.embedding_density_calibration_run(id) ON DELETE CASCADE
);

CREATE TABLE public.embedding_density_label_group_member (
    group_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    CONSTRAINT embedding_density_label_group_member_pkey PRIMARY KEY (group_id, tag_id),
    CONSTRAINT embedding_density_label_group_member_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.embedding_density_label_group(id) ON DELETE CASCADE,
    CONSTRAINT embedding_density_label_group_member_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE
);

CREATE TABLE public.embedding_density_decision_threshold (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    calibration_run_id uuid NOT NULL,
    scope text NOT NULL,
    tag_id uuid,
    group_id uuid,
    threshold real NOT NULL,
    lower_bound real NOT NULL,
    CONSTRAINT embedding_density_decision_threshold_pkey PRIMARY KEY (id),
    CONSTRAINT embedding_density_decision_threshold_calibration_run_id_fkey FOREIGN KEY (calibration_run_id) REFERENCES public.embedding_density_calibration_run(id) ON DELETE CASCADE,
    CONSTRAINT embedding_density_decision_threshold_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE,
    CONSTRAINT embedding_density_decision_threshold_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.embedding_density_label_group(id) ON DELETE CASCADE,
    CONSTRAINT embedding_density_decision_threshold_scope_check CHECK ((scope = ANY (ARRAY['coarse'::text, 'fine'::text]))),
    CONSTRAINT embedding_density_decision_threshold_target_check CHECK (
        (scope = 'fine' AND tag_id IS NOT NULL AND group_id IS NULL)
        OR (scope = 'coarse' AND group_id IS NOT NULL AND tag_id IS NULL)
    )
);

CREATE TABLE public.embedding_density_correction (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    document_id uuid NOT NULL,
    from_tag_id uuid,
    to_tag_id uuid NOT NULL,
    model_version_id uuid,
    created_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status text NOT NULL,
    CONSTRAINT embedding_density_correction_pkey PRIMARY KEY (id),
    CONSTRAINT embedding_density_correction_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE,
    CONSTRAINT embedding_density_correction_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE,
    CONSTRAINT embedding_density_correction_from_tag_id_fkey FOREIGN KEY (from_tag_id) REFERENCES public.tags(id) ON DELETE SET NULL,
    CONSTRAINT embedding_density_correction_to_tag_id_fkey FOREIGN KEY (to_tag_id) REFERENCES public.tags(id) ON DELETE CASCADE,
    CONSTRAINT embedding_density_correction_model_version_id_fkey FOREIGN KEY (model_version_id) REFERENCES public.ml_model_versions(id) ON DELETE SET NULL,
    CONSTRAINT embedding_density_correction_created_by_fkey FOREIGN KEY (created_by) REFERENCES public."user"(id) ON DELETE CASCADE,
    CONSTRAINT embedding_density_correction_status_check CHECK ((status = ANY (ARRAY['active'::text, 'absorbed'::text, 'withdrawn'::text])))
);

CREATE TABLE public.embedding_density_correction_offset (
    correction_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    "offset" real NOT NULL,
    CONSTRAINT embedding_density_correction_offset_pkey PRIMARY KEY (correction_id, tag_id),
    CONSTRAINT embedding_density_correction_offset_correction_id_fkey FOREIGN KEY (correction_id) REFERENCES public.embedding_density_correction(id) ON DELETE CASCADE,
    CONSTRAINT embedding_density_correction_offset_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE
);

CREATE TABLE public.embedding_density_user_state (
    user_id text NOT NULL,
    model_version_id uuid,
    active_calibration_run_id uuid,
    temperature real DEFAULT 1 NOT NULL,
    novelty_log_threshold real DEFAULT '-Infinity'::real NOT NULL,
    calibration_ready boolean DEFAULT false NOT NULL,
    class_bias jsonb DEFAULT '[]'::jsonb NOT NULL,
    kernel_bandwidth real DEFAULT 0.5 NOT NULL,
    CONSTRAINT embedding_density_user_state_pkey PRIMARY KEY (user_id),
    CONSTRAINT embedding_density_user_state_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE,
    CONSTRAINT embedding_density_user_state_model_version_id_fkey FOREIGN KEY (model_version_id) REFERENCES public.ml_model_versions(id) ON DELETE SET NULL,
    CONSTRAINT embedding_density_user_state_active_calibration_run_id_fkey FOREIGN KEY (active_calibration_run_id) REFERENCES public.embedding_density_calibration_run(id) ON DELETE SET NULL
);

CREATE TABLE public.embedding_density_class_niw (
    user_id text NOT NULL,
    tag_id uuid NOT NULL,
    sample_count integer NOT NULL,
    sum_x jsonb NOT NULL,
    sum_xx jsonb NOT NULL,
    CONSTRAINT embedding_density_class_niw_pkey PRIMARY KEY (user_id, tag_id),
    CONSTRAINT embedding_density_class_niw_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE,
    CONSTRAINT embedding_density_class_niw_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE
);

ALTER TABLE public.document_tag_suggestions
    ADD COLUMN IF NOT EXISTS decision_tier text;

CREATE INDEX embedding_density_calibration_run_user_id_idx ON public.embedding_density_calibration_run USING btree (user_id);
CREATE INDEX embedding_density_correction_user_id_status_idx ON public.embedding_density_correction USING btree (user_id, status);
