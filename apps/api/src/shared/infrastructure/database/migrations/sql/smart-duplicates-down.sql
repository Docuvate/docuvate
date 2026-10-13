ALTER TABLE public.feature_flag
    DROP CONSTRAINT feature_flag_key_check;

ALTER TABLE public.feature_flag
    ADD CONSTRAINT feature_flag_key_check CHECK (
        flag_key IN (
            'layout_reconstruction_compare',
            'source_connectors',
            'experimental_research_models'
        )
    );

DELETE FROM public.feature_flag WHERE flag_key = 'smart_duplicates';

ALTER TABLE public.document_duplicate_candidates
    DROP CONSTRAINT document_duplicate_candidates_source_check;

DELETE FROM public.document_duplicate_candidates WHERE source = 'smart';

ALTER TABLE public.document_duplicate_candidates
    ADD CONSTRAINT document_duplicate_candidates_source_check CHECK (
        source = ANY (ARRAY['hash'::text, 'embedding'::text])
    );
