-- Transactional job outbox: Postgres is source of truth; Valkey/BullMQ is a cache.
-- IF NOT EXISTS: baseline stamp may re-run this after global setup already applied it.
CREATE TABLE IF NOT EXISTS public.job_types (
    code text NOT NULL,
    queue_name text NOT NULL,
    description text NOT NULL,
    CONSTRAINT job_types_pkey PRIMARY KEY (code)
);

INSERT INTO public.job_types (code, queue_name, description) VALUES
    ('document-extraction', 'document-extraction', 'OCR and field extraction for one document')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.job_outbox (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_type text NOT NULL,
    document_id uuid NOT NULL,
    user_id text NOT NULL,
    idempotency_key text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    max_attempts integer DEFAULT 5 NOT NULL,
    next_attempt_at timestamp with time zone DEFAULT now() NOT NULL,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    enqueued_at timestamp with time zone,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    CONSTRAINT job_outbox_pkey PRIMARY KEY (id),
    CONSTRAINT job_outbox_idempotency_key_key UNIQUE (idempotency_key),
    CONSTRAINT job_outbox_job_type_fkey FOREIGN KEY (job_type) REFERENCES public.job_types(code),
    CONSTRAINT job_outbox_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE,
    CONSTRAINT job_outbox_status_check CHECK (
        (status = ANY (ARRAY[
            'pending'::text,
            'enqueued'::text,
            'running'::text,
            'done'::text,
            'failed'::text
        ]))
    ),
    CONSTRAINT job_outbox_attempts_nonnegative CHECK (attempts >= 0),
    CONSTRAINT job_outbox_max_attempts_positive CHECK (max_attempts > 0)
);

CREATE INDEX IF NOT EXISTS job_outbox_relay_idx
    ON public.job_outbox USING btree (status, next_attempt_at, updated_at);

CREATE INDEX IF NOT EXISTS job_outbox_document_id_idx
    ON public.job_outbox USING btree (document_id);

CREATE INDEX IF NOT EXISTS job_outbox_user_id_idx
    ON public.job_outbox USING btree (user_id);
