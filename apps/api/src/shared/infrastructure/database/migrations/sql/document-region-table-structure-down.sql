DROP TABLE IF EXISTS public.document_region_table_row_roles;
ALTER TABLE public.document_region_table_rules DROP COLUMN IF EXISTS line;
ALTER TABLE public.document_region_tables
  DROP COLUMN IF EXISTS banded,
  DROP COLUMN IF EXISTS trailing_header_cols,
  DROP COLUMN IF EXISTS footer_rows;
