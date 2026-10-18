ALTER TABLE public.document_tag_suggestions DROP COLUMN IF EXISTS decision_tier;

DROP TABLE IF EXISTS public.embedding_density_class_niw;
DROP TABLE IF EXISTS public.embedding_density_user_state;
DROP TABLE IF EXISTS public.embedding_density_correction_offset;
DROP TABLE IF EXISTS public.embedding_density_correction;
DROP TABLE IF EXISTS public.embedding_density_decision_threshold;
DROP TABLE IF EXISTS public.embedding_density_label_group_member;
DROP TABLE IF EXISTS public.embedding_density_label_group;
DROP TABLE IF EXISTS public.embedding_density_calibration_run;

DELETE FROM public.ml_model_families WHERE id = 'layout-niw';
