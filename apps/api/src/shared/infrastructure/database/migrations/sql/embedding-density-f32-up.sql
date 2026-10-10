-- Compact float32 storage for NIW sufficient statistics (see niw-stats.codec.ts).

ALTER TABLE public.embedding_density_class_niw
    ADD COLUMN IF NOT EXISTS sum_x_f32 bytea,
    ADD COLUMN IF NOT EXISTS sum_xx_f32 bytea;

ALTER TABLE public.embedding_density_class_niw
    ALTER COLUMN sum_x DROP NOT NULL,
    ALTER COLUMN sum_xx DROP NOT NULL;
