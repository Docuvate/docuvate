-- Repair Paperless placeholder .bin filenames using stored MIME types.
UPDATE documents
SET filename = regexp_replace(filename, '\.bin$', '.pdf', 'i'),
    updated_at = GREATEST(updated_at, NOW())
WHERE lower(filename) LIKE '%.bin'
  AND mime_type = 'application/pdf';

UPDATE documents
SET filename = regexp_replace(filename, '\.bin$', '.jpg', 'i'),
    updated_at = GREATEST(updated_at, NOW())
WHERE lower(filename) LIKE '%.bin'
  AND mime_type = 'image/jpeg';

UPDATE documents
SET filename = regexp_replace(filename, '\.bin$', '.png', 'i'),
    updated_at = GREATEST(updated_at, NOW())
WHERE lower(filename) LIKE '%.bin'
  AND mime_type = 'image/png';

UPDATE documents
SET filename = regexp_replace(filename, '\.bin$', '.tif', 'i'),
    updated_at = GREATEST(updated_at, NOW())
WHERE lower(filename) LIKE '%.bin'
  AND mime_type = 'image/tiff';

UPDATE documents
SET filename = regexp_replace(filename, '\.bin$', '.docx', 'i'),
    updated_at = GREATEST(updated_at, NOW())
WHERE lower(filename) LIKE '%.bin'
  AND mime_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
