DROP TABLE IF EXISTS public.document_extracted_fact_value_date;
DROP TABLE IF EXISTS public.document_extracted_fact_value_amount;
DROP TABLE IF EXISTS public.document_extracted_fact_value_text;
DROP TABLE IF EXISTS public.document_extracted_fact_provenance;
DROP TABLE IF EXISTS public.document_extracted_fact;
DROP TABLE IF EXISTS public.document_exact_fact_index;

ALTER TABLE public.feature_flag DROP CONSTRAINT IF EXISTS feature_flag_key_check;
ALTER TABLE public.feature_flag ADD CONSTRAINT feature_flag_key_check CHECK (
    flag_key IN (
        'layout_reconstruction_compare',
        'source_connectors',
        'experimental_research_models'
    )
);
