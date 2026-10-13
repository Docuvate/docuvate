-- answerAbstention feature flag + per-tenant exact-fact match gate (3NF)

ALTER TABLE public.feature_flag DROP CONSTRAINT IF EXISTS feature_flag_key_check;
ALTER TABLE public.feature_flag ADD CONSTRAINT feature_flag_key_check CHECK (
    flag_key IN (
        'layout_reconstruction_compare',
        'source_connectors',
        'experimental_research_models',
        'exact_answers',
        'answer_abstention'
    )
);

CREATE TABLE public.tenant_exact_fact_chat_settings (
    tenant_id text NOT NULL,
    match_score_threshold real,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT tenant_exact_fact_chat_settings_pkey PRIMARY KEY (tenant_id),
    CONSTRAINT tenant_exact_fact_chat_settings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public."user"(id) ON DELETE CASCADE,
    CONSTRAINT tenant_exact_fact_chat_settings_threshold_range CHECK (
        match_score_threshold IS NULL OR (match_score_threshold >= 0 AND match_score_threshold <= 1)
    )
);

ALTER TABLE public.tenant_exact_fact_chat_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_exact_fact_chat_settings FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_exact_fact_chat_settings_isolation ON public.tenant_exact_fact_chat_settings
    USING (tenant_id = current_setting('app.tenant_id', true));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_exact_fact_chat_settings TO docuvate_rls_enforcer;
