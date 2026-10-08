CREATE EXTENSION pgcrypto WITH SCHEMA public;
CREATE FUNCTION public.documents_search_vector_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.filename, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.notes, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW.extracted_text, '')), 'B');
  RETURN NEW;
END
$$;
CREATE TABLE public.account (
    id text NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" text NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp with time zone,
    "refreshTokenExpiresAt" timestamp with time zone,
    scope text,
    password text,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thread_id uuid NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    generation_status text,
    generation_phase text,
    error_code text,
    error_detail text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chat_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);
CREATE TABLE public.chat_thread_documents (
    thread_id uuid NOT NULL,
    document_id uuid NOT NULL,
    user_id text NOT NULL,
    linked_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.chat_threads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    title text DEFAULT 'Neuer Chat'::text NOT NULL,
    scope text DEFAULT 'document'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chat_threads_scope_check CHECK ((scope = ANY (ARRAY['document'::text, 'corpus'::text])))
);
CREATE TABLE public.connector_installations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    plugin_id text NOT NULL,
    display_name text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    credentials_encrypted bytea NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.correspondents (
    id uuid NOT NULL,
    user_id text NOT NULL,
    name text NOT NULL,
    matching_algorithm text DEFAULT 'none'::text NOT NULL,
    match_text text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.document_duplicate_candidates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    document_id uuid NOT NULL,
    candidate_document_id uuid NOT NULL,
    similarity real NOT NULL,
    source text NOT NULL,
    dismissed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT document_duplicate_candidates_check CHECK ((document_id <> candidate_document_id)),
    CONSTRAINT document_duplicate_candidates_source_check CHECK ((source = ANY (ARRAY['hash'::text, 'embedding'::text])))
);
CREATE TABLE public.document_duplicate_stacks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.document_embeddings (
    document_id uuid NOT NULL,
    user_id text NOT NULL,
    model text NOT NULL,
    embedding jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.document_stack_members (
    stack_id uuid NOT NULL,
    document_id uuid NOT NULL,
    user_id text NOT NULL,
    role text NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT document_stack_members_role_check CHECK ((role = ANY (ARRAY['primary'::text, 'version'::text])))
);
CREATE TABLE public.document_tag_suggestions (
    document_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    reason text DEFAULT ''::text NOT NULL,
    dismissed boolean DEFAULT false NOT NULL,
    source text DEFAULT 'rule'::text NOT NULL,
    confidence real
);
CREATE TABLE public.document_tags (
    document_id uuid NOT NULL,
    tag_id uuid NOT NULL
);
CREATE TABLE public.documents (
    id uuid NOT NULL,
    user_id text NOT NULL,
    filename text NOT NULL,
    mime_type text NOT NULL,
    storage_key text NOT NULL,
    status text NOT NULL,
    extracted_text text,
    extracted_fields jsonb,
    search_vector tsvector,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    title text DEFAULT ''::text,
    document_date date,
    notes text,
    correspondent_id uuid,
    folder_id uuid,
    content_hash text,
    extracted_markdown text,
    mappe_id uuid,
    CONSTRAINT documents_folder_or_mappe_exclusive CHECK ((NOT ((folder_id IS NOT NULL) AND (mappe_id IS NOT NULL))))
);
CREATE TABLE public.extraction_arena_ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    document_id uuid,
    winner_engine text NOT NULL,
    compared_engines jsonb DEFAULT '[]'::jsonb NOT NULL,
    rating smallint,
    source text DEFAULT 'manual'::text NOT NULL,
    compare_snapshot jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT extraction_arena_ratings_rating_check CHECK (((rating IS NULL) OR ((rating >= 1) AND (rating <= 5)))),
    CONSTRAINT extraction_arena_ratings_source_check CHECK ((source = ANY (ARRAY['manual'::text, 'sample'::text])))
);
CREATE TABLE public.extraction_field_corrections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    document_id uuid NOT NULL,
    field_key text NOT NULL,
    old_value text DEFAULT ''::text NOT NULL,
    new_value text DEFAULT ''::text NOT NULL,
    label_tag_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    field_tag_id uuid,
    source text DEFAULT 'user_correction'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT extraction_field_corrections_source_check CHECK ((source = 'user_correction'::text))
);
CREATE TABLE public.folders (
    id uuid NOT NULL,
    user_id text NOT NULL,
    name text NOT NULL,
    parent_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    mappe_id uuid
);
CREATE TABLE public.label_recommendation_blocklist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    phrase text NOT NULL,
    label_key text NOT NULL,
    source text DEFAULT 'manual'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT label_recommendation_blocklist_source_check CHECK ((source = ANY (ARRAY['manual'::text, 'dismiss'::text])))
);
CREATE TABLE public.label_recommendation_blocklist_patterns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    pattern text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.label_recommendation_dismissals (
    user_id text NOT NULL,
    recommendation_key text NOT NULL,
    dismissed_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.mappen (
    id uuid NOT NULL,
    user_id text NOT NULL,
    name text NOT NULL,
    color text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.ml_canary_evaluations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    version_id uuid NOT NULL,
    baseline_version_id uuid,
    metric_name text NOT NULL,
    baseline_value double precision,
    candidate_value double precision,
    max_allowed_drop double precision NOT NULL,
    passed boolean NOT NULL,
    evaluated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.ml_model_families (
    id text NOT NULL,
    kind text NOT NULL,
    display_name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ml_model_families_kind_check CHECK ((kind = ANY (ARRAY['ocr'::text, 'embedding'::text, 'docqa'::text, 'field_extractor'::text])))
);
CREATE TABLE public.ml_model_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id text NOT NULL,
    version_tag text NOT NULL,
    artifact_uri text,
    external_run_id text,
    metrics jsonb DEFAULT '{}'::jsonb NOT NULL,
    lifecycle text DEFAULT 'registered'::text NOT NULL,
    training_snapshot_id uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    promoted_at timestamp with time zone,
    CONSTRAINT ml_model_versions_lifecycle_check CHECK ((lifecycle = ANY (ARRAY['registered'::text, 'canary'::text, 'active'::text, 'archived'::text, 'failed'::text])))
);
CREATE TABLE public.ml_retrain_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id text NOT NULL,
    trigger_kind text NOT NULL,
    status text DEFAULT 'queued'::text NOT NULL,
    training_snapshot_id uuid,
    result_version_id uuid,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    CONSTRAINT ml_retrain_jobs_status_check CHECK ((status = ANY (ARRAY['queued'::text, 'running'::text, 'succeeded'::text, 'failed'::text, 'cancelled'::text]))),
    CONSTRAINT ml_retrain_jobs_trigger_kind_check CHECK ((trigger_kind = ANY (ARRAY['cron'::text, 'threshold'::text, 'manual'::text])))
);
CREATE TABLE public.ml_training_data_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id text NOT NULL,
    dataset_version text NOT NULL,
    source_watermark timestamp with time zone,
    row_count integer DEFAULT 0 NOT NULL,
    storage_uri text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.recognized_field_definitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    field_key text NOT NULL,
    label text NOT NULL,
    field_type text DEFAULT 'text'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    extract_for_all_documents boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    gate_label_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    gate_label_match text DEFAULT 'all'::text NOT NULL,
    min_label_confidence real,
    confidence_gate_enabled boolean,
    CONSTRAINT recognized_field_definitions_field_type_check CHECK ((field_type = ANY (ARRAY['text'::text, 'date'::text, 'number'::text, 'currency'::text]))),
    CONSTRAINT recognized_field_definitions_gate_label_match_check CHECK ((gate_label_match = ANY (ARRAY['any'::text, 'all'::text])))
);
CREATE TABLE public.session (
    id text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    token text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" text NOT NULL
);
CREATE TABLE public.tag_custom_field_definitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tag_id uuid NOT NULL,
    user_id text NOT NULL,
    field_key text NOT NULL,
    label text NOT NULL,
    field_type text DEFAULT 'text'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tag_custom_field_definitions_field_type_check CHECK ((field_type = ANY (ARRAY['text'::text, 'date'::text, 'number'::text, 'currency'::text])))
);
CREATE TABLE public.tag_embedding_centroids (
    tag_id uuid NOT NULL,
    user_id text NOT NULL,
    model text NOT NULL,
    sample_count integer DEFAULT 0 NOT NULL,
    centroid jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.tag_embedding_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    document_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    action text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tag_embedding_feedback_action_check CHECK ((action = ANY (ARRAY['accept'::text, 'reject'::text])))
);
CREATE TABLE public.tags (
    id uuid NOT NULL,
    user_id text NOT NULL,
    name text NOT NULL,
    color text,
    is_inbox boolean DEFAULT false NOT NULL,
    matching_algorithm text DEFAULT 'none'::text NOT NULL,
    match_text text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."user" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean DEFAULT false NOT NULL,
    image text,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.user_preferences (
    user_id text NOT NULL,
    preferred_extractor_engine text DEFAULT 'pipeline'::text NOT NULL,
    use_arena_winner_as_default boolean DEFAULT false NOT NULL,
    arena_winner_engine text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    preferred_chat_provider text,
    label_field_confidence_threshold real DEFAULT 0.62 NOT NULL,
    field_extraction_confidence_gate_enabled boolean DEFAULT true NOT NULL,
    field_extraction_required_label_ids jsonb DEFAULT '[]'::jsonb NOT NULL,
    label_near_similarity_threshold real DEFAULT 0.62 NOT NULL,
    advanced_features_enabled boolean DEFAULT false NOT NULL,
    theme_preference text DEFAULT 'system'::text NOT NULL,
    locale text,
    CONSTRAINT user_preferences_theme_preference_check CHECK ((theme_preference = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text]))),
    CONSTRAINT user_preferences_locale_check CHECK (((locale IS NULL) OR (locale = ANY (ARRAY['de'::text, 'en'::text]))))
);
CREATE TABLE public.verification (
    id text NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.chat_thread_documents
    ADD CONSTRAINT chat_thread_documents_pkey PRIMARY KEY (thread_id, document_id);
ALTER TABLE ONLY public.chat_threads
    ADD CONSTRAINT chat_threads_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.connector_installations
    ADD CONSTRAINT connector_installations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.connector_installations
    ADD CONSTRAINT connector_installations_user_id_plugin_id_key UNIQUE (user_id, plugin_id);
ALTER TABLE ONLY public.correspondents
    ADD CONSTRAINT correspondents_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.correspondents
    ADD CONSTRAINT correspondents_user_id_name_key UNIQUE (user_id, name);
ALTER TABLE ONLY public.document_duplicate_candidates
    ADD CONSTRAINT document_duplicate_candidates_document_id_candidate_documen_key UNIQUE (document_id, candidate_document_id);
ALTER TABLE ONLY public.document_duplicate_candidates
    ADD CONSTRAINT document_duplicate_candidates_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.document_duplicate_stacks
    ADD CONSTRAINT document_duplicate_stacks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.document_embeddings
    ADD CONSTRAINT document_embeddings_pkey PRIMARY KEY (document_id);
ALTER TABLE ONLY public.document_stack_members
    ADD CONSTRAINT document_stack_members_pkey PRIMARY KEY (document_id);
ALTER TABLE ONLY public.document_tag_suggestions
    ADD CONSTRAINT document_tag_suggestions_pkey PRIMARY KEY (document_id, tag_id);
ALTER TABLE ONLY public.document_tags
    ADD CONSTRAINT document_tags_pkey PRIMARY KEY (document_id, tag_id);
ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.extraction_arena_ratings
    ADD CONSTRAINT extraction_arena_ratings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.extraction_field_corrections
    ADD CONSTRAINT extraction_field_corrections_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_user_id_parent_id_name_key UNIQUE (user_id, parent_id, name);
ALTER TABLE ONLY public.label_recommendation_blocklist_patterns
    ADD CONSTRAINT label_recommendation_blocklist_patterns_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.label_recommendation_blocklist_patterns
    ADD CONSTRAINT label_recommendation_blocklist_patterns_user_id_pattern_key UNIQUE (user_id, pattern);
ALTER TABLE ONLY public.label_recommendation_blocklist
    ADD CONSTRAINT label_recommendation_blocklist_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.label_recommendation_blocklist
    ADD CONSTRAINT label_recommendation_blocklist_user_id_label_key_key UNIQUE (user_id, label_key);
ALTER TABLE ONLY public.label_recommendation_dismissals
    ADD CONSTRAINT label_recommendation_dismissals_pkey PRIMARY KEY (user_id, recommendation_key);
ALTER TABLE ONLY public.mappen
    ADD CONSTRAINT mappen_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.mappen
    ADD CONSTRAINT mappen_user_id_name_key UNIQUE (user_id, name);
ALTER TABLE ONLY public.ml_canary_evaluations
    ADD CONSTRAINT ml_canary_evaluations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ml_model_families
    ADD CONSTRAINT ml_model_families_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ml_model_versions
    ADD CONSTRAINT ml_model_versions_family_id_version_tag_key UNIQUE (family_id, version_tag);
ALTER TABLE ONLY public.ml_model_versions
    ADD CONSTRAINT ml_model_versions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ml_retrain_jobs
    ADD CONSTRAINT ml_retrain_jobs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ml_training_data_snapshots
    ADD CONSTRAINT ml_training_data_snapshots_family_id_dataset_version_key UNIQUE (family_id, dataset_version);
ALTER TABLE ONLY public.ml_training_data_snapshots
    ADD CONSTRAINT ml_training_data_snapshots_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.recognized_field_definitions
    ADD CONSTRAINT recognized_field_definitions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.recognized_field_definitions
    ADD CONSTRAINT recognized_field_definitions_user_id_field_key_key UNIQUE (user_id, field_key);
ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_token_key UNIQUE (token);
ALTER TABLE ONLY public.tag_custom_field_definitions
    ADD CONSTRAINT tag_custom_field_definitions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.tag_custom_field_definitions
    ADD CONSTRAINT tag_custom_field_definitions_tag_id_field_key_key UNIQUE (tag_id, field_key);
ALTER TABLE ONLY public.tag_embedding_centroids
    ADD CONSTRAINT tag_embedding_centroids_pkey PRIMARY KEY (tag_id);
ALTER TABLE ONLY public.tag_embedding_feedback
    ADD CONSTRAINT tag_embedding_feedback_document_id_tag_id_action_key UNIQUE (document_id, tag_id, action);
ALTER TABLE ONLY public.tag_embedding_feedback
    ADD CONSTRAINT tag_embedding_feedback_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_user_id_name_key UNIQUE (user_id, name);
ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);
ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY public.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);
CREATE INDEX chat_messages_thread_idx ON public.chat_messages USING btree (thread_id, created_at);
CREATE INDEX chat_thread_documents_document_idx ON public.chat_thread_documents USING btree (document_id, user_id);
CREATE INDEX connector_installations_user_idx ON public.connector_installations USING btree (user_id);
CREATE INDEX document_duplicate_candidates_doc_idx ON public.document_duplicate_candidates USING btree (document_id) WHERE (dismissed = false);
CREATE INDEX document_embeddings_user_id_idx ON public.document_embeddings USING btree (user_id);
CREATE UNIQUE INDEX document_stack_members_one_primary_idx ON public.document_stack_members USING btree (stack_id) WHERE (role = 'primary'::text);
CREATE INDEX document_stack_members_stack_idx ON public.document_stack_members USING btree (stack_id);
CREATE INDEX document_tags_tag_id_idx ON public.document_tags USING btree (tag_id);
CREATE INDEX documents_content_hash_idx ON public.documents USING btree (user_id, content_hash);
CREATE INDEX documents_folder_id_idx ON public.documents USING btree (folder_id);
CREATE INDEX documents_mappe_id_idx ON public.documents USING btree (mappe_id);
CREATE INDEX documents_search_idx ON public.documents USING gin (search_vector);
CREATE INDEX documents_user_id_idx ON public.documents USING btree (user_id);
CREATE INDEX extraction_arena_ratings_user_idx ON public.extraction_arena_ratings USING btree (user_id, created_at DESC);
CREATE INDEX extraction_field_corrections_document_idx ON public.extraction_field_corrections USING btree (document_id, created_at DESC);
CREATE INDEX extraction_field_corrections_user_created_idx ON public.extraction_field_corrections USING btree (user_id, created_at DESC);
CREATE INDEX folders_mappe_id_idx ON public.folders USING btree (mappe_id);
CREATE INDEX folders_user_id_idx ON public.folders USING btree (user_id);
CREATE INDEX mappen_user_id_idx ON public.mappen USING btree (user_id);
CREATE INDEX ml_model_versions_family_lifecycle_idx ON public.ml_model_versions USING btree (family_id, lifecycle);
CREATE INDEX ml_retrain_jobs_family_status_idx ON public.ml_retrain_jobs USING btree (family_id, status, created_at DESC);
CREATE INDEX recognized_field_definitions_user_idx ON public.recognized_field_definitions USING btree (user_id);
CREATE INDEX tag_custom_field_definitions_tag_idx ON public.tag_custom_field_definitions USING btree (tag_id);
CREATE INDEX tag_embedding_centroids_user_id_idx ON public.tag_embedding_centroids USING btree (user_id);
CREATE INDEX tags_user_id_idx ON public.tags USING btree (user_id);
CREATE UNIQUE INDEX tags_user_inbox_idx ON public.tags USING btree (user_id) WHERE (is_inbox = true);
CREATE TRIGGER documents_search_vector_trigger BEFORE INSERT OR UPDATE OF filename, title, notes, extracted_text ON public.documents FOR EACH ROW EXECUTE FUNCTION public.documents_search_vector_update();
ALTER TABLE ONLY public.account
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.chat_threads(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.chat_thread_documents
    ADD CONSTRAINT chat_thread_documents_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.chat_thread_documents
    ADD CONSTRAINT chat_thread_documents_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.chat_threads(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.chat_thread_documents
    ADD CONSTRAINT chat_thread_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.chat_threads
    ADD CONSTRAINT chat_threads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.connector_installations
    ADD CONSTRAINT connector_installations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.correspondents
    ADD CONSTRAINT correspondents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.document_duplicate_candidates
    ADD CONSTRAINT document_duplicate_candidates_candidate_document_id_fkey FOREIGN KEY (candidate_document_id) REFERENCES public.documents(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.document_duplicate_candidates
    ADD CONSTRAINT document_duplicate_candidates_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.document_duplicate_candidates
    ADD CONSTRAINT document_duplicate_candidates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.document_duplicate_stacks
    ADD CONSTRAINT document_duplicate_stacks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.document_embeddings
    ADD CONSTRAINT document_embeddings_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.document_embeddings
    ADD CONSTRAINT document_embeddings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.document_stack_members
    ADD CONSTRAINT document_stack_members_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.document_stack_members
    ADD CONSTRAINT document_stack_members_stack_id_fkey FOREIGN KEY (stack_id) REFERENCES public.document_duplicate_stacks(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.document_stack_members
    ADD CONSTRAINT document_stack_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.document_tag_suggestions
    ADD CONSTRAINT document_tag_suggestions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.document_tag_suggestions
    ADD CONSTRAINT document_tag_suggestions_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.document_tags
    ADD CONSTRAINT document_tags_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.document_tags
    ADD CONSTRAINT document_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_correspondent_id_fkey FOREIGN KEY (correspondent_id) REFERENCES public.correspondents(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_mappe_id_fkey FOREIGN KEY (mappe_id) REFERENCES public.mappen(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.extraction_arena_ratings
    ADD CONSTRAINT extraction_arena_ratings_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.extraction_arena_ratings
    ADD CONSTRAINT extraction_arena_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.extraction_field_corrections
    ADD CONSTRAINT extraction_field_corrections_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.extraction_field_corrections
    ADD CONSTRAINT extraction_field_corrections_field_tag_id_fkey FOREIGN KEY (field_tag_id) REFERENCES public.tags(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.extraction_field_corrections
    ADD CONSTRAINT extraction_field_corrections_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_mappe_id_fkey FOREIGN KEY (mappe_id) REFERENCES public.mappen(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.folders(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.label_recommendation_blocklist_patterns
    ADD CONSTRAINT label_recommendation_blocklist_patterns_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.label_recommendation_blocklist
    ADD CONSTRAINT label_recommendation_blocklist_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.label_recommendation_dismissals
    ADD CONSTRAINT label_recommendation_dismissals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.mappen
    ADD CONSTRAINT mappen_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.ml_canary_evaluations
    ADD CONSTRAINT ml_canary_evaluations_baseline_version_id_fkey FOREIGN KEY (baseline_version_id) REFERENCES public.ml_model_versions(id);
ALTER TABLE ONLY public.ml_canary_evaluations
    ADD CONSTRAINT ml_canary_evaluations_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.ml_model_versions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.ml_model_versions
    ADD CONSTRAINT ml_model_versions_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.ml_model_families(id);
ALTER TABLE ONLY public.ml_model_versions
    ADD CONSTRAINT ml_model_versions_training_snapshot_id_fkey FOREIGN KEY (training_snapshot_id) REFERENCES public.ml_training_data_snapshots(id);
ALTER TABLE ONLY public.ml_retrain_jobs
    ADD CONSTRAINT ml_retrain_jobs_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.ml_model_families(id);
ALTER TABLE ONLY public.ml_retrain_jobs
    ADD CONSTRAINT ml_retrain_jobs_result_version_id_fkey FOREIGN KEY (result_version_id) REFERENCES public.ml_model_versions(id);
ALTER TABLE ONLY public.ml_retrain_jobs
    ADD CONSTRAINT ml_retrain_jobs_training_snapshot_id_fkey FOREIGN KEY (training_snapshot_id) REFERENCES public.ml_training_data_snapshots(id);
ALTER TABLE ONLY public.ml_training_data_snapshots
    ADD CONSTRAINT ml_training_data_snapshots_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.ml_model_families(id);
ALTER TABLE ONLY public.recognized_field_definitions
    ADD CONSTRAINT recognized_field_definitions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.session
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.tag_custom_field_definitions
    ADD CONSTRAINT tag_custom_field_definitions_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.tag_custom_field_definitions
    ADD CONSTRAINT tag_custom_field_definitions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.tag_embedding_centroids
    ADD CONSTRAINT tag_embedding_centroids_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.tag_embedding_centroids
    ADD CONSTRAINT tag_embedding_centroids_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.tag_embedding_feedback
    ADD CONSTRAINT tag_embedding_feedback_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.tag_embedding_feedback
    ADD CONSTRAINT tag_embedding_feedback_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.tag_embedding_feedback
    ADD CONSTRAINT tag_embedding_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;

INSERT INTO ml_model_families (id, kind, display_name, description)
VALUES
  ('paddle-ocr', 'ocr', 'PaddleOCR PP-OCRv4', 'Default scan OCR (CPU mobile models)'),
  ('fastembed-minilm', 'embedding', 'FastEmbed MiniLM', 'Document embeddings and tag suggestions'),
  ('context-docqa', 'docqa', 'Context document QA', 'Embedding-grounded chat in worker'),
  ('heuristic-fields', 'field_extractor', 'Heuristic + label fields', 'Regex/heuristic fields; fine-tune target for correction signal')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ml_model_versions (family_id, version_tag, lifecycle, metrics, notes)
VALUES
  ('paddle-ocr', 'bootstrap-1', 'active', '{"ocr_cer": 0.08}'::jsonb, 'Shipped default; not from retrain pipeline'),
  ('fastembed-minilm', 'bootstrap-1', 'active', '{"embedding_recall_at_10": 0.82}'::jsonb, 'Shipped default'),
  ('context-docqa', 'bootstrap-1', 'active', '{"answer_f1": 0.71}'::jsonb, 'Shipped default'),
  ('heuristic-fields', 'bootstrap-1', 'active', '{"field_f1": 0.65}'::jsonb, 'Shipped default')
ON CONFLICT (family_id, version_tag) DO NOTHING;

