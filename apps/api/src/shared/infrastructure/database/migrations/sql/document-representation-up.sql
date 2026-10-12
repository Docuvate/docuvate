-- Central per-tenant document representation (R1)

ALTER TABLE public.document_embeddings ALTER COLUMN embedding DROP NOT NULL;
ALTER TABLE public.document_text_chunks ALTER COLUMN embedding DROP NOT NULL;
ALTER TABLE public.document_text_chunks ADD COLUMN IF NOT EXISTS vector_scale real;
ALTER TABLE public.document_text_chunks ADD COLUMN IF NOT EXISTS vector_int8 bytea;
ALTER TABLE public.document_text_chunks ADD COLUMN IF NOT EXISTS binary_code bytea;

INSERT INTO ml_model_families (id, kind, display_name, description)
VALUES (
  'document-encoder',
  'embedding',
  'Document encoder (multilingual-e5-small)',
  'Single-passage encoder for document units and queries'
)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.document_representation (
    document_id uuid NOT NULL,
    tenant_id text NOT NULL,
    encoder_id text NOT NULL,
    encoder_revision text NOT NULL,
    representation_version integer NOT NULL,
    document_mean_scale real NOT NULL,
    document_mean_int8 bytea NOT NULL,
    document_max_scale real NOT NULL,
    document_max_int8 bytea NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT document_representation_pkey PRIMARY KEY (document_id),
    CONSTRAINT document_representation_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE,
    CONSTRAINT document_representation_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public."user"(id) ON DELETE CASCADE
);

CREATE INDEX document_representation_tenant_id_idx ON public.document_representation (tenant_id);

CREATE TABLE public.document_representation_unit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    tenant_id text NOT NULL,
    unit_index integer NOT NULL,
    kind text NOT NULL,
    body text NOT NULL,
    page integer,
    bbox_x real,
    bbox_y real,
    bbox_width real,
    bbox_height real,
    char_start integer,
    char_end integer,
    vector_scale real NOT NULL,
    vector_int8 bytea NOT NULL,
    binary_code bytea NOT NULL,
    CONSTRAINT document_representation_unit_pkey PRIMARY KEY (id),
    CONSTRAINT document_representation_unit_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE,
    CONSTRAINT document_representation_unit_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public."user"(id) ON DELETE CASCADE,
    CONSTRAINT document_representation_unit_document_unit_key UNIQUE (document_id, unit_index)
);

CREATE INDEX document_representation_unit_tenant_id_idx ON public.document_representation_unit (tenant_id);
CREATE INDEX document_representation_unit_document_id_idx ON public.document_representation_unit (document_id);

CREATE TABLE public.tenant_label_calibration (
    tenant_id text NOT NULL,
    temperature real NOT NULL,
    tau_precision_099 real NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tenant_label_calibration_pkey PRIMARY KEY (tenant_id),
    CONSTRAINT tenant_label_calibration_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public."user"(id) ON DELETE CASCADE
);

CREATE TABLE public.tenant_label_prototype (
    tenant_id text NOT NULL,
    tag_id uuid NOT NULL,
    sample_count integer NOT NULL,
    sum_x bytea NOT NULL,
    sum_xx bytea NOT NULL,
    prototype_scale real NOT NULL,
    prototype_int8 bytea NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tenant_label_prototype_pkey PRIMARY KEY (tenant_id, tag_id),
    CONSTRAINT tenant_label_prototype_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public."user"(id) ON DELETE CASCADE,
    CONSTRAINT tenant_label_prototype_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE
);

-- Row-level security (tenant_id = current_setting('app.tenant_id'))

ALTER TABLE public.document_representation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_representation FORCE ROW LEVEL SECURITY;
ALTER TABLE public.document_representation_unit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_representation_unit FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_label_calibration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_label_calibration FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_label_prototype ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_label_prototype FORCE ROW LEVEL SECURITY;

CREATE POLICY document_representation_tenant_isolation ON public.document_representation
    USING (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY document_representation_unit_tenant_isolation ON public.document_representation_unit
    USING (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY tenant_label_calibration_tenant_isolation ON public.tenant_label_calibration
    USING (tenant_id = current_setting('app.tenant_id', true));

CREATE POLICY tenant_label_prototype_tenant_isolation ON public.tenant_label_prototype
    USING (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY document_embeddings_tenant_isolation ON public.document_embeddings
    USING (
        EXISTS (
            SELECT 1 FROM public.documents d
            WHERE d.id = document_embeddings.document_id
              AND d.user_id = current_setting('app.tenant_id', true)
        )
    );

ALTER TABLE public.document_text_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY document_text_chunks_tenant_isolation ON public.document_text_chunks
    USING (
        EXISTS (
            SELECT 1 FROM public.documents d
            WHERE d.id = document_text_chunks.document_id
              AND d.user_id = current_setting('app.tenant_id', true)
        )
    );

ALTER TABLE public.embedding_density_class_niw ENABLE ROW LEVEL SECURITY;
CREATE POLICY embedding_density_class_niw_tenant_isolation ON public.embedding_density_class_niw
    USING (user_id = current_setting('app.tenant_id', true));

ALTER TABLE public.embedding_density_correction ENABLE ROW LEVEL SECURITY;
CREATE POLICY embedding_density_correction_tenant_isolation ON public.embedding_density_correction
    USING (user_id = current_setting('app.tenant_id', true));

ALTER TABLE public.document_tag_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY document_tag_suggestions_tenant_isolation ON public.document_tag_suggestions
    USING (
        EXISTS (
            SELECT 1 FROM public.documents d
            WHERE d.id = document_tag_suggestions.document_id
              AND d.user_id = current_setting('app.tenant_id', true)
        )
    );

ALTER TABLE public.document_duplicate_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY document_duplicate_candidates_tenant_isolation ON public.document_duplicate_candidates
    USING (user_id = current_setting('app.tenant_id', true));

-- Role for integration tests and defense-in-depth: enforce RLS even when the session user bypasses RLS.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'docuvate_rls_enforcer') THEN
    CREATE ROLE docuvate_rls_enforcer NOLOGIN NOBYPASSRLS;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO docuvate_rls_enforcer;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.document_representation,
  public.document_representation_unit,
  public.tenant_label_calibration,
  public.tenant_label_prototype,
  public.document_embeddings,
  public.document_text_chunks,
  public.embedding_density_class_niw,
  public.embedding_density_correction,
  public.document_tag_suggestions,
  public.document_duplicate_candidates
TO docuvate_rls_enforcer;

GRANT docuvate_rls_enforcer TO docuvate;
