DROP INDEX IF EXISTS public.job_outbox_user_id_idx;
DROP INDEX IF EXISTS public.job_outbox_document_id_idx;
DROP INDEX IF EXISTS public.job_outbox_relay_idx;
DROP TABLE IF EXISTS public.job_outbox;
DROP TABLE IF EXISTS public.job_types;
