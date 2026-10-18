ALTER TABLE public.embedding_density_user_state
    DROP COLUMN IF EXISTS fine_ready_tag_ids;

ALTER TABLE public.embedding_density_user_state
    RENAME COLUMN coarse_ready TO calibration_ready;
