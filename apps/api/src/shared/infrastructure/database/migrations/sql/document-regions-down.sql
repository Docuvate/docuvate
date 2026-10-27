DELETE FROM public.corrections WHERE kind IN ('field', 'table', 'block');

DROP TABLE IF EXISTS public.correction_field_scopes;
DROP TABLE IF EXISTS public.correction_field_values;
DROP TABLE IF EXISTS public.correction_region_changes;
DROP TABLE IF EXISTS public.document_field_token_spans;
DROP TABLE IF EXISTS public.document_region_block_types;
DROP TABLE IF EXISTS public.document_region_table_cell_texts;
DROP TABLE IF EXISTS public.document_region_table_merges;
DROP TABLE IF EXISTS public.document_region_table_rules;
DROP TABLE IF EXISTS public.document_region_tables;
DROP TABLE IF EXISTS public.document_region_fields;
DROP TABLE IF EXISTS public.document_region_vertices;
DROP TABLE IF EXISTS public.document_region_tokens;
DROP TABLE IF EXISTS public.document_regions;

ALTER TABLE public.corrections
  DROP CONSTRAINT IF EXISTS corrections_kind_check;

ALTER TABLE public.corrections
  ADD CONSTRAINT corrections_kind_check
  CHECK (kind = ANY (ARRAY['label'::text]));

ALTER TABLE public.extraction_field_confirmations
  DROP COLUMN IF EXISTS value_sha256;

ALTER TABLE public.document_layout_ir
  DROP COLUMN IF EXISTS ir_sha256;
