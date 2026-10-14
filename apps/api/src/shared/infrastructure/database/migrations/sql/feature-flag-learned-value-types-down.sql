DELETE FROM public.feature_flag WHERE flag_key = 'learned_value_types';

ALTER TABLE public.feature_flag DROP CONSTRAINT feature_flag_key_check;

ALTER TABLE public.feature_flag ADD CONSTRAINT feature_flag_key_check CHECK (
    flag_key IN (
        'layout_reconstruction_compare',
        'source_connectors',
        'experimental_research_models',
        'exact_answers',
        'smart_duplicates',
        'answer_abstention',
        'learned_value_types',
        'layout_key_value_roles',
        'local_chat_model'
    )
);
