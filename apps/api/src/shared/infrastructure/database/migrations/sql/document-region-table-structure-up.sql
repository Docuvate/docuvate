-- Composable table structure: footer band and trailing (right) index columns are attributes of
-- the table; row roles and line evidence are keyed by row and by rule. Appearance (lines,
-- banding) is kept apart from semantics (bands, index, merges).
ALTER TABLE public.document_region_tables
  ADD COLUMN IF NOT EXISTS footer_rows integer DEFAULT 0 NOT NULL CHECK (footer_rows >= 0),
  ADD COLUMN IF NOT EXISTS trailing_header_cols integer DEFAULT 0 NOT NULL
    CHECK (trailing_header_cols >= 0),
  ADD COLUMN IF NOT EXISTS banded boolean DEFAULT false NOT NULL;

ALTER TABLE public.document_region_table_rules
  ADD COLUMN IF NOT EXISTS line text DEFAULT 'unknown' NOT NULL
    CHECK (line IN ('unknown', 'none', 'thin', 'thick', 'double'));

CREATE TABLE IF NOT EXISTS public.document_region_table_row_roles (
  region_id uuid NOT NULL REFERENCES public.document_region_tables(region_id) ON DELETE CASCADE,
  row integer NOT NULL CHECK (row >= 0),
  role text NOT NULL CHECK (role IN ('section', 'subtotal')),
  PRIMARY KEY (region_id, row)
);
