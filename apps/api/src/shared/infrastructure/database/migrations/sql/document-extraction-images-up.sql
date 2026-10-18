CREATE TABLE document_extraction_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents (id) ON DELETE CASCADE,
  position integer NOT NULL,
  page integer NOT NULL CHECK (page >= 1),
  x double precision NOT NULL CHECK (x >= 0 AND x <= 1),
  y double precision NOT NULL CHECK (y >= 0 AND y <= 1),
  width double precision NOT NULL CHECK (width > 0 AND width <= 1),
  height double precision NOT NULL CHECK (height > 0 AND height <= 1),
  kind text NOT NULL CHECK (kind IN ('embedded', 'figure')),
  caption text,
  thumbnail_storage_key text NOT NULL,
  CONSTRAINT document_extraction_images_document_position_key UNIQUE (document_id, position)
);

CREATE INDEX document_extraction_images_document_id_idx
  ON document_extraction_images (document_id);
