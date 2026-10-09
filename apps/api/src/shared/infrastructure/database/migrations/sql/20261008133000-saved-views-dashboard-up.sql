CREATE TABLE public.saved_document_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_user_id text NOT NULL,
    name text NOT NULL,
    visibility text DEFAULT 'private'::text NOT NULL,
    search_query text DEFAULT ''::text NOT NULL,
    sort_field text DEFAULT 'updatedAt'::text NOT NULL,
    sort_order text DEFAULT 'desc'::text NOT NULL,
    view_mode text DEFAULT 'klassisch'::text NOT NULL,
    filter_mode text DEFAULT 'ui'::text NOT NULL,
    list_scope text DEFAULT 'all'::text NOT NULL,
    folder_id uuid,
    mappe_id uuid,
    correspondent_id uuid,
    status_filter text,
    inbox_filter boolean,
    without_non_inbox_label boolean,
    document_date_from date,
    document_date_to date,
    pinned_sidebar boolean DEFAULT false NOT NULL,
    position integer DEFAULT 0 NOT NULL,
    visible_columns jsonb DEFAULT '["title","labels","date","status"]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT saved_document_views_visibility_check CHECK (
        visibility = ANY (ARRAY['private'::text, 'shared'::text])
    ),
    CONSTRAINT saved_document_views_sort_field_check CHECK (
        sort_field = ANY (
            ARRAY['updatedAt'::text, 'createdAt'::text, 'title'::text, 'documentDate'::text]
        )
    ),
    CONSTRAINT saved_document_views_sort_order_check CHECK (
        sort_order = ANY (ARRAY['asc'::text, 'desc'::text])
    ),
    CONSTRAINT saved_document_views_view_mode_check CHECK (
        view_mode = ANY (ARRAY['klassisch'::text, 'karten'::text, 'fokus'::text])
    ),
    CONSTRAINT saved_document_views_filter_mode_check CHECK (
        filter_mode = ANY (ARRAY['ui'::text, 'query'::text])
    ),
    CONSTRAINT saved_document_views_list_scope_check CHECK (
        list_scope = ANY (ARRAY['all'::text, 'folder'::text, 'mappe'::text])
    )
);

CREATE TABLE public.saved_document_view_tags (
    view_id uuid NOT NULL,
    tag_id uuid NOT NULL
);

CREATE TABLE public.dashboard_widgets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    widget_type text NOT NULL,
    position integer DEFAULT 0 NOT NULL,
    width_cols smallint DEFAULT 6 NOT NULL,
    height_rows smallint DEFAULT 2 NOT NULL,
    saved_view_id uuid,
    item_limit smallint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT dashboard_widgets_widget_type_check CHECK (
        widget_type = ANY (
            ARRAY[
                'saved_view'::text,
                'upload'::text,
                'statistics'::text,
                'recent_documents'::text,
                'attention'::text
            ]
        )
    ),
    CONSTRAINT dashboard_widgets_width_cols_check CHECK (
        (width_cols >= 1) AND (width_cols <= 12)
    ),
    CONSTRAINT dashboard_widgets_height_rows_check CHECK (
        (height_rows >= 1) AND (height_rows <= 6)
    ),
    CONSTRAINT dashboard_widgets_item_limit_check CHECK (
        item_limit IS NULL OR (item_limit >= 1 AND item_limit <= 50)
    ),
    CONSTRAINT dashboard_widgets_saved_view_fk_check CHECK (
        (widget_type = 'saved_view' AND saved_view_id IS NOT NULL)
        OR (widget_type <> 'saved_view' AND saved_view_id IS NULL)
    )
);

CREATE TABLE public.installation_dashboard_widgets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    widget_type text NOT NULL,
    position integer DEFAULT 0 NOT NULL,
    width_cols smallint DEFAULT 6 NOT NULL,
    height_rows smallint DEFAULT 2 NOT NULL,
    saved_view_id uuid,
    item_limit smallint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT installation_dashboard_widgets_widget_type_check CHECK (
        widget_type = ANY (
            ARRAY[
                'saved_view'::text,
                'upload'::text,
                'statistics'::text,
                'recent_documents'::text,
                'attention'::text
            ]
        )
    ),
    CONSTRAINT installation_dashboard_widgets_width_cols_check CHECK (
        (width_cols >= 1) AND (width_cols <= 12)
    ),
    CONSTRAINT installation_dashboard_widgets_height_rows_check CHECK (
        (height_rows >= 1) AND (height_rows <= 6)
    ),
    CONSTRAINT installation_dashboard_widgets_item_limit_check CHECK (
        item_limit IS NULL OR (item_limit >= 1 AND item_limit <= 50)
    ),
    CONSTRAINT installation_dashboard_widgets_saved_view_fk_check CHECK (
        (widget_type = 'saved_view' AND saved_view_id IS NOT NULL)
        OR (widget_type <> 'saved_view' AND saved_view_id IS NULL)
    )
);

ALTER TABLE ONLY public.saved_document_views
    ADD CONSTRAINT saved_document_views_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.saved_document_view_tags
    ADD CONSTRAINT saved_document_view_tags_pkey PRIMARY KEY (view_id, tag_id);

ALTER TABLE ONLY public.dashboard_widgets
    ADD CONSTRAINT dashboard_widgets_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.installation_dashboard_widgets
    ADD CONSTRAINT installation_dashboard_widgets_pkey PRIMARY KEY (id);

CREATE INDEX saved_document_views_owner_idx ON public.saved_document_views USING btree (owner_user_id);

CREATE INDEX saved_document_views_visibility_idx ON public.saved_document_views USING btree (visibility);

CREATE INDEX saved_document_views_owner_position_idx ON public.saved_document_views USING btree (owner_user_id, position);

CREATE INDEX dashboard_widgets_user_position_idx ON public.dashboard_widgets USING btree (user_id, position);

CREATE INDEX installation_dashboard_widgets_position_idx ON public.installation_dashboard_widgets USING btree (position);

ALTER TABLE ONLY public.saved_document_views
    ADD CONSTRAINT saved_document_views_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public."user"(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.saved_document_views
    ADD CONSTRAINT saved_document_views_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.saved_document_views
    ADD CONSTRAINT saved_document_views_mappe_id_fkey FOREIGN KEY (mappe_id) REFERENCES public.mappen(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.saved_document_views
    ADD CONSTRAINT saved_document_views_correspondent_id_fkey FOREIGN KEY (correspondent_id) REFERENCES public.correspondents(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.saved_document_view_tags
    ADD CONSTRAINT saved_document_view_tags_view_id_fkey FOREIGN KEY (view_id) REFERENCES public.saved_document_views(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.saved_document_view_tags
    ADD CONSTRAINT saved_document_view_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.dashboard_widgets
    ADD CONSTRAINT dashboard_widgets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.dashboard_widgets
    ADD CONSTRAINT dashboard_widgets_saved_view_id_fkey FOREIGN KEY (saved_view_id) REFERENCES public.saved_document_views(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.installation_dashboard_widgets
    ADD CONSTRAINT installation_dashboard_widgets_saved_view_id_fkey FOREIGN KEY (saved_view_id) REFERENCES public.saved_document_views(id) ON DELETE CASCADE;

INSERT INTO public.installation_dashboard_widgets (widget_type, position, width_cols, height_rows, item_limit)
VALUES
    ('upload', 0, 6, 2, NULL),
    ('statistics', 1, 6, 2, NULL),
    ('recent_documents', 2, 6, 2, 8),
    ('attention', 3, 6, 2, 6);
