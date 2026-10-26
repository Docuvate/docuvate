ALTER TABLE public.document_layout_ir
  ADD COLUMN IF NOT EXISTS ir_sha256 bytea;

UPDATE public.document_layout_ir
SET ir_sha256 = digest(convert_to(ir::text, 'UTF8'), 'sha256')
WHERE ir_sha256 IS NULL;

ALTER TABLE public.document_layout_ir
  ALTER COLUMN ir_sha256 SET NOT NULL;

ALTER TABLE public.extraction_field_confirmations
  ADD COLUMN IF NOT EXISTS value_sha256 bytea;

ALTER TABLE public.corrections
  DROP CONSTRAINT IF EXISTS corrections_kind_check;

ALTER TABLE public.corrections
  ADD CONSTRAINT corrections_kind_check
  CHECK (kind = ANY (ARRAY['label'::text, 'field'::text, 'table'::text, 'block'::text]));

CREATE TABLE public.document_regions (
  id uuid PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  page integer NOT NULL CHECK (page >= 1),
  x0 real NOT NULL,
  y0 real NOT NULL,
  x1 real NOT NULL,
  y1 real NOT NULL,
  shape text NOT NULL CHECK (shape IN ('rect', 'polygon')),
  role text NOT NULL CHECK (role IN ('field', 'table', 'block', 'ignore')),
  ir_sha256 bytea NOT NULL,
  superseded_by uuid REFERENCES public.document_regions(id),
  needs_review boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (0 <= x0 AND x0 < x1 AND x1 <= 1 AND 0 <= y0 AND y0 < y1 AND y1 <= 1),
  UNIQUE (id, document_id)
);

CREATE INDEX document_regions_document_active_idx
  ON public.document_regions (document_id, role, created_at DESC)
  WHERE superseded_by IS NULL;

CREATE TABLE public.document_region_tokens (
  region_id uuid NOT NULL REFERENCES public.document_regions(id) ON DELETE CASCADE,
  block_index integer NOT NULL,
  PRIMARY KEY (region_id, block_index)
);

CREATE TABLE public.document_region_vertices (
  region_id uuid NOT NULL REFERENCES public.document_regions(id) ON DELETE CASCADE,
  ord integer NOT NULL CHECK (ord >= 0),
  x real NOT NULL,
  y real NOT NULL,
  PRIMARY KEY (region_id, ord),
  CHECK (0 <= x AND x <= 1 AND 0 <= y AND y <= 1)
);

CREATE TABLE public.document_region_fields (
  region_id uuid PRIMARY KEY REFERENCES public.document_regions(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  value_override text
);

CREATE INDEX document_region_fields_field_key_idx
  ON public.document_region_fields (field_key);

CREATE TABLE public.document_region_tables (
  region_id uuid PRIMARY KEY REFERENCES public.document_regions(id) ON DELETE CASCADE,
  table_type text NOT NULL CHECK (table_type IN ('line_items', 'key_value', 'other')),
  header_rows integer NOT NULL DEFAULT 0 CHECK (header_rows >= 0),
  header_cols integer NOT NULL DEFAULT 0 CHECK (header_cols >= 0)
);

CREATE TABLE public.document_region_table_rules (
  region_id uuid NOT NULL REFERENCES public.document_region_tables(region_id) ON DELETE CASCADE,
  axis text NOT NULL CHECK (axis IN ('row', 'col')),
  ord integer NOT NULL CHECK (ord >= 0),
  pos real NOT NULL,
  PRIMARY KEY (region_id, axis, ord)
);

CREATE TABLE public.document_region_table_merges (
  region_id uuid NOT NULL REFERENCES public.document_region_tables(region_id) ON DELETE CASCADE,
  row0 integer NOT NULL CHECK (row0 >= 0),
  col0 integer NOT NULL CHECK (col0 >= 0),
  row_span integer NOT NULL CHECK (row_span >= 1),
  col_span integer NOT NULL CHECK (col_span >= 1),
  PRIMARY KEY (region_id, row0, col0)
);

CREATE TABLE public.document_region_table_cell_texts (
  region_id uuid NOT NULL REFERENCES public.document_region_tables(region_id) ON DELETE CASCADE,
  row integer NOT NULL CHECK (row >= 0),
  col integer NOT NULL CHECK (col >= 0),
  text text NOT NULL,
  PRIMARY KEY (region_id, row, col)
);

CREATE TABLE public.document_region_block_types (
  region_id uuid PRIMARY KEY REFERENCES public.document_regions(id) ON DELETE CASCADE,
  block_type text NOT NULL CHECK (
    block_type IN ('heading', 'paragraph', 'list', 'key_value', 'table', 'header', 'footer')
  ),
  heading_level integer,
  reading_rank integer
);

CREATE TABLE public.document_field_token_spans (
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  block_index integer NOT NULL,
  PRIMARY KEY (document_id, field_key, block_index)
);

CREATE TABLE public.correction_region_changes (
  correction_id uuid PRIMARY KEY REFERENCES public.corrections(id) ON DELETE CASCADE,
  op text NOT NULL,
  before_region_id uuid REFERENCES public.document_regions(id),
  after_region_id uuid REFERENCES public.document_regions(id)
);

CREATE TABLE public.correction_field_values (
  correction_id uuid PRIMARY KEY REFERENCES public.corrections(id) ON DELETE CASCADE,
  old_value text,
  new_value text
);

CREATE TABLE public.correction_field_scopes (
  correction_id uuid PRIMARY KEY REFERENCES public.corrections(id) ON DELETE CASCADE,
  scope text NOT NULL CHECK (scope IN ('document', 'label', 'always')),
  tag_id uuid REFERENCES public.tags(id),
  CHECK ((scope = 'label') = (tag_id IS NOT NULL))
);
