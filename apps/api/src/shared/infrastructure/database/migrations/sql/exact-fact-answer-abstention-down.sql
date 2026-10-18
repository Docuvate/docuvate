DROP TABLE IF EXISTS public.tenant_exact_fact_chat_settings;

ALTER TABLE public.feature_flag DROP CONSTRAINT IF EXISTS feature_flag_key_check;
ALTER TABLE public.feature_flag ADD CONSTRAINT feature_flag_key_check CHECK (
    flag_key IN (
        'layout_reconstruction_compare',
        'source_connectors',
        'experimental_research_models',
        'exact_answers'
    )
);
