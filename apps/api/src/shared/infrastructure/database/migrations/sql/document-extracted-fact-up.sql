-- Per-tenant exact fact index (3NF, ADR 015)

ALTER TABLE public.feature_flag DROP CONSTRAINT IF EXISTS feature_flag_key_check;
ALTER TABLE public.feature_flag ADD CONSTRAINT feature_flag_key_check CHECK (
    flag_key IN (
        'layout_reconstruction_compare',
        'source_connectors',
        'experimental_research_models',
        'exact_answers'
    )
);

CREATE TABLE public.document_exact_fact_index (
    document_id uuid NOT NULL,
    tenant_id text NOT NULL,
    fact_count integer NOT NULL,
    wall_time_ms real,
    indexed_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT document_exact_fact_index_pkey PRIMARY KEY (document_id),
    CONSTRAINT document_exact_fact_index_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE,
    CONSTRAINT document_exact_fact_index_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public."user"(id) ON DELETE CASCADE
);

CREATE INDEX document_exact_fact_index_tenant_id_idx ON public.document_exact_fact_index (tenant_id);

CREATE TABLE public.document_extracted_fact (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id text NOT NULL,
    document_id uuid NOT NULL,
    kind text NOT NULL,
    predicate_key text NOT NULL,
    confidence real NOT NULL,
    table_index integer,
    row_index integer,
    col_index integer,
    CONSTRAINT document_extracted_fact_pkey PRIMARY KEY (id),
    CONSTRAINT document_extracted_fact_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE,
    CONSTRAINT document_extracted_fact_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public."user"(id) ON DELETE CASCADE,
    CONSTRAINT document_extracted_fact_kind_check CHECK (
        kind IN ('key_value', 'amount', 'date', 'table_cell')
    )
);

CREATE INDEX document_extracted_fact_tenant_document_idx
    ON public.document_extracted_fact (tenant_id, document_id);
CREATE INDEX document_extracted_fact_tenant_predicate_idx
    ON public.document_extracted_fact (tenant_id, predicate_key);

CREATE TABLE public.document_extracted_fact_provenance (
    fact_id uuid NOT NULL,
    page integer,
    bbox_x real,
    bbox_y real,
    bbox_width real,
    bbox_height real,
    char_start integer,
    char_end integer,
    CONSTRAINT document_extracted_fact_provenance_pkey PRIMARY KEY (fact_id),
    CONSTRAINT document_extracted_fact_provenance_fact_id_fkey FOREIGN KEY (fact_id) REFERENCES public.document_extracted_fact(id) ON DELETE CASCADE
);

CREATE TABLE public.document_extracted_fact_value_text (
    fact_id uuid NOT NULL,
    value_text text NOT NULL,
    CONSTRAINT document_extracted_fact_value_text_pkey PRIMARY KEY (fact_id),
    CONSTRAINT document_extracted_fact_value_text_fact_id_fkey FOREIGN KEY (fact_id) REFERENCES public.document_extracted_fact(id) ON DELETE CASCADE
);

CREATE TABLE public.document_extracted_fact_value_amount (
    fact_id uuid NOT NULL,
    amount_numeric numeric NOT NULL,
    currency_code text,
    CONSTRAINT document_extracted_fact_value_amount_pkey PRIMARY KEY (fact_id),
    CONSTRAINT document_extracted_fact_value_amount_fact_id_fkey FOREIGN KEY (fact_id) REFERENCES public.document_extracted_fact(id) ON DELETE CASCADE
);

CREATE TABLE public.document_extracted_fact_value_date (
    fact_id uuid NOT NULL,
    value_date date NOT NULL,
    CONSTRAINT document_extracted_fact_value_date_pkey PRIMARY KEY (fact_id),
    CONSTRAINT document_extracted_fact_value_date_fact_id_fkey FOREIGN KEY (fact_id) REFERENCES public.document_extracted_fact(id) ON DELETE CASCADE
);

ALTER TABLE public.document_exact_fact_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_exact_fact_index FORCE ROW LEVEL SECURITY;
CREATE POLICY document_exact_fact_index_tenant_isolation ON public.document_exact_fact_index
    USING (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE public.document_extracted_fact ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_extracted_fact FORCE ROW LEVEL SECURITY;
CREATE POLICY document_extracted_fact_tenant_isolation ON public.document_extracted_fact
    USING (tenant_id = current_setting('app.tenant_id', true));

ALTER TABLE public.document_extracted_fact_provenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_extracted_fact_provenance FORCE ROW LEVEL SECURITY;
CREATE POLICY document_extracted_fact_provenance_tenant_isolation ON public.document_extracted_fact_provenance
    USING (
        EXISTS (
            SELECT 1
            FROM public.document_extracted_fact f
            WHERE f.id = fact_id
              AND f.tenant_id = current_setting('app.tenant_id', true)
        )
    );

ALTER TABLE public.document_extracted_fact_value_text ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_extracted_fact_value_text FORCE ROW LEVEL SECURITY;
CREATE POLICY document_extracted_fact_value_text_tenant_isolation ON public.document_extracted_fact_value_text
    USING (
        EXISTS (
            SELECT 1
            FROM public.document_extracted_fact f
            WHERE f.id = fact_id
              AND f.tenant_id = current_setting('app.tenant_id', true)
        )
    );

ALTER TABLE public.document_extracted_fact_value_amount ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_extracted_fact_value_amount FORCE ROW LEVEL SECURITY;
CREATE POLICY document_extracted_fact_value_amount_tenant_isolation ON public.document_extracted_fact_value_amount
    USING (
        EXISTS (
            SELECT 1
            FROM public.document_extracted_fact f
            WHERE f.id = fact_id
              AND f.tenant_id = current_setting('app.tenant_id', true)
        )
    );

ALTER TABLE public.document_extracted_fact_value_date ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_extracted_fact_value_date FORCE ROW LEVEL SECURITY;
CREATE POLICY document_extracted_fact_value_date_tenant_isolation ON public.document_extracted_fact_value_date
    USING (
        EXISTS (
            SELECT 1
            FROM public.document_extracted_fact f
            WHERE f.id = fact_id
              AND f.tenant_id = current_setting('app.tenant_id', true)
        )
    );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_exact_fact_index TO docuvate_rls_enforcer;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_extracted_fact TO docuvate_rls_enforcer;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_extracted_fact_provenance TO docuvate_rls_enforcer;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_extracted_fact_value_text TO docuvate_rls_enforcer;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_extracted_fact_value_amount TO docuvate_rls_enforcer;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_extracted_fact_value_date TO docuvate_rls_enforcer;
