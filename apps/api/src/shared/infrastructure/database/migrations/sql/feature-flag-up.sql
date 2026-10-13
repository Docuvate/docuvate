CREATE TABLE public.feature_flag (
    tenant_id text NOT NULL,
    flag_key text NOT NULL,
    enabled boolean NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT feature_flag_pkey PRIMARY KEY (tenant_id, flag_key),
    CONSTRAINT feature_flag_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public."user"(id) ON DELETE CASCADE,
    CONSTRAINT feature_flag_key_check CHECK (
        flag_key IN (
            'layout_reconstruction_compare',
            'source_connectors',
            'experimental_research_models'
        )
    )
);

CREATE INDEX feature_flag_tenant_id_idx ON public.feature_flag (tenant_id);

ALTER TABLE public.feature_flag ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flag FORCE ROW LEVEL SECURITY;

CREATE POLICY feature_flag_tenant_isolation ON public.feature_flag
    USING (tenant_id = current_setting('app.tenant_id', true));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feature_flag TO docuvate_rls_enforcer;
