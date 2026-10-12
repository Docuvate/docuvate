DROP POLICY IF EXISTS document_duplicate_candidates_tenant_isolation ON public.document_duplicate_candidates;
ALTER TABLE public.document_duplicate_candidates DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS document_tag_suggestions_tenant_isolation ON public.document_tag_suggestions;
ALTER TABLE public.document_tag_suggestions DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS embedding_density_correction_tenant_isolation ON public.embedding_density_correction;
ALTER TABLE public.embedding_density_correction DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS embedding_density_class_niw_tenant_isolation ON public.embedding_density_class_niw;
ALTER TABLE public.embedding_density_class_niw DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS document_text_chunks_tenant_isolation ON public.document_text_chunks;
ALTER TABLE public.document_text_chunks DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS document_embeddings_tenant_isolation ON public.document_embeddings;
ALTER TABLE public.document_embeddings DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_label_prototype_tenant_isolation ON public.tenant_label_prototype;
DROP POLICY IF EXISTS tenant_label_calibration_tenant_isolation ON public.tenant_label_calibration;
DROP POLICY IF EXISTS document_representation_unit_tenant_isolation ON public.document_representation_unit;
REVOKE docuvate_rls_enforcer FROM docuvate;
DROP ROLE IF EXISTS docuvate_rls_enforcer;

DROP POLICY IF EXISTS document_representation_tenant_isolation ON public.document_representation;

DROP TABLE IF EXISTS public.tenant_label_prototype;
DROP TABLE IF EXISTS public.tenant_label_calibration;
DROP TABLE IF EXISTS public.document_representation_unit;
DROP TABLE IF EXISTS public.document_representation;

DELETE FROM ml_model_families WHERE id = 'document-encoder';

ALTER TABLE public.document_text_chunks DROP COLUMN IF EXISTS binary_code;
ALTER TABLE public.document_text_chunks DROP COLUMN IF EXISTS vector_int8;
ALTER TABLE public.document_text_chunks DROP COLUMN IF EXISTS vector_scale;
ALTER TABLE public.document_text_chunks ALTER COLUMN embedding SET NOT NULL;
ALTER TABLE public.document_embeddings ALTER COLUMN embedding SET NOT NULL;
