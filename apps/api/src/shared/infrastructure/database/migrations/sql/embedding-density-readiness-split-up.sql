ALTER TABLE public.embedding_density_user_state
    RENAME COLUMN calibration_ready TO coarse_ready;

ALTER TABLE public.embedding_density_user_state
    ADD COLUMN fine_ready_tag_ids jsonb DEFAULT '[]'::jsonb NOT NULL;

COMMENT ON COLUMN public.embedding_density_user_state.coarse_ready IS
    'Coarse (0.99) auto-apply tier certified on >=528 certification blocks (~2112 unique documents at 25% cert split).';

COMMENT ON COLUMN public.embedding_density_user_state.fine_ready_tag_ids IS
    'Tag ids whose fine (0.95) confirm tier is certified (>=104 certification blocks, ~416 unique documents per label at 25% cert split).';
