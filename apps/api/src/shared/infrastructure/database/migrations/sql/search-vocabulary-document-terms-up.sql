CREATE TABLE IF NOT EXISTS search_vocabulary_document_terms (
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  PRIMARY KEY (document_id, term)
);

CREATE INDEX IF NOT EXISTS search_vocabulary_document_terms_user_term_idx
  ON search_vocabulary_document_terms (user_id, term);

INSERT INTO search_vocabulary_document_terms (user_id, document_id, term)
SELECT DISTINCT d.user_id, d.id AS document_id, tok.term
FROM documents d
JOIN document_text_chunks c ON c.document_id = d.id
CROSS JOIN LATERAL (
  SELECT trim(both from tok_raw) AS term
  FROM regexp_split_to_table(lower(unaccent(c.body)), '[^[:alnum:]]+') AS tok_raw
) tok
WHERE length(tok.term) >= 3
  AND length(tok.term) <= 48
UNION
SELECT DISTINCT d.user_id, d.id, tok.term
FROM documents d
CROSS JOIN LATERAL (
  SELECT trim(both from tok_raw) AS term
  FROM regexp_split_to_table(
    lower(unaccent(concat_ws(' ', coalesce(d.title, ''), coalesce(d.filename, ''), coalesce(d.extracted_text, '')))),
    '[^[:alnum:]]+'
  ) AS tok_raw
) tok
WHERE length(tok.term) >= 3
  AND length(tok.term) <= 48
UNION
SELECT DISTINCT d.user_id, d.id, tok.term
FROM documents d
JOIN document_field_values v ON v.document_id = d.id
CROSS JOIN LATERAL (
  SELECT trim(both from tok_raw) AS term
  FROM regexp_split_to_table(
    lower(unaccent(concat_ws(' ', coalesce(v.value_text_norm, ''), coalesce(v.value_text, '')))),
    '[^[:alnum:]]+'
  ) AS tok_raw
) tok
WHERE length(tok.term) >= 3
  AND length(tok.term) <= 48
ON CONFLICT (document_id, term) DO NOTHING;

UPDATE search_vocabulary_terms s
SET doc_frequency = c.doc_frequency,
    updated_at = now()
FROM (
  SELECT user_id, term, count(*)::int AS doc_frequency
  FROM search_vocabulary_document_terms
  GROUP BY user_id, term
) c
WHERE s.user_id = c.user_id
  AND s.term = c.term;

DELETE FROM search_vocabulary_terms s
WHERE NOT EXISTS (
  SELECT 1
  FROM search_vocabulary_document_terms j
  WHERE j.user_id = s.user_id
    AND j.term = s.term
);
