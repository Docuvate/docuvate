CREATE TABLE IF NOT EXISTS public.document_recognized_field_extraction_attempt (
    document_id uuid NOT NULL,
    field_definition_id uuid NOT NULL,
    tenant_id text NOT NULL,
    outcome text NOT NULL,
    confidence real,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT document_recognized_field_extraction_attempt_pkey
        PRIMARY KEY (document_id, field_definition_id),
    CONSTRAINT document_recognized_field_extraction_attempt_document_id_fkey
        FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE,
    CONSTRAINT document_recognized_field_extraction_attempt_field_definition_id_fkey
        FOREIGN KEY (field_definition_id) REFERENCES public.recognized_field_definitions(id) ON DELETE CASCADE,
    CONSTRAINT document_recognized_field_extraction_attempt_tenant_id_fkey
        FOREIGN KEY (tenant_id) REFERENCES public."user"(id) ON DELETE CASCADE,
    CONSTRAINT document_recognized_field_extraction_attempt_outcome_check CHECK (
        outcome IN ('not_applicable', 'pending', 'not_found', 'below_threshold', 'found')
    )
);

CREATE INDEX IF NOT EXISTS document_recognized_field_extraction_attempt_tenant_document_idx
    ON public.document_recognized_field_extraction_attempt (tenant_id, document_id);

ALTER TABLE public.document_recognized_field_extraction_attempt ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_recognized_field_extraction_attempt FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS document_recognized_field_extraction_attempt_tenant_isolation
    ON public.document_recognized_field_extraction_attempt;

CREATE POLICY document_recognized_field_extraction_attempt_tenant_isolation
    ON public.document_recognized_field_extraction_attempt
    USING (tenant_id = current_setting('app.tenant_id', true));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_recognized_field_extraction_attempt TO docuvate_rls_enforcer;
