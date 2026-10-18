DROP TABLE IF EXISTS public.correction_propagated_assignments;
ALTER TABLE public.embedding_density_correction DROP CONSTRAINT IF EXISTS embedding_density_correction_correction_id_fkey;
DROP INDEX IF EXISTS public.embedding_density_correction_correction_id_uidx;
ALTER TABLE public.embedding_density_correction DROP COLUMN IF EXISTS correction_id;
DROP TABLE IF EXISTS public.correction_label_assignments;
DROP TABLE IF EXISTS public.corrections;
