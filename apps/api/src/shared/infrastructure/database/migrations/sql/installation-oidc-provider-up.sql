CREATE TABLE public.installation_oidc_provider (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id text NOT NULL,
    display_name text NOT NULL,
    issuer text NOT NULL,
    client_id text NOT NULL,
    client_secret_encrypted bytea NOT NULL,
    scopes text DEFAULT 'openid email profile'::text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    source text DEFAULT 'admin'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT installation_oidc_provider_pkey PRIMARY KEY (id),
    CONSTRAINT installation_oidc_provider_provider_id_key UNIQUE (provider_id),
    CONSTRAINT installation_oidc_provider_provider_id_check CHECK (
        provider_id ~ '^[a-z][a-z0-9_-]{0,62}$'::text
    ),
    CONSTRAINT installation_oidc_provider_source_check CHECK (
        source = ANY (ARRAY['admin'::text, 'env'::text])
    )
);

CREATE INDEX installation_oidc_provider_enabled_idx
    ON public.installation_oidc_provider (enabled, provider_id);
