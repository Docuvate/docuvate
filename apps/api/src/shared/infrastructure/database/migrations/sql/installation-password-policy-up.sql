CREATE TABLE public.installation_password_policy (
  singleton_key text NOT NULL DEFAULT 'default',
  min_length integer NOT NULL DEFAULT 12,
  require_lower boolean NOT NULL DEFAULT false,
  require_upper boolean NOT NULL DEFAULT false,
  require_digit boolean NOT NULL DEFAULT false,
  require_symbol boolean NOT NULL DEFAULT false,
  check_breached boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT installation_password_policy_pkey PRIMARY KEY (singleton_key),
  CONSTRAINT installation_password_policy_singleton_check CHECK (singleton_key = 'default'),
  CONSTRAINT installation_password_policy_min_length_check CHECK (
    min_length >= 8
    AND min_length <= 128
  )
);

INSERT INTO public.installation_password_policy (singleton_key)
VALUES ('default')
ON CONFLICT (singleton_key) DO NOTHING;
