CREATE TABLE duplicate_pair_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  document_id_a uuid NOT NULL,
  document_id_b uuid NOT NULL,
  label text NOT NULL CHECK (label IN ('duplicate', 'not_duplicate')),
  embedding_similarity real NOT NULL,
  fraction_differing_tokens real NOT NULL,
  fraction_differing_value_tokens real NOT NULL,
  relative_page_count_diff real NOT NULL,
  perceptual_page_hash_distance real NOT NULL,
  shingle_jaccard_distance real NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT duplicate_pair_labels_document_order CHECK (document_id_a < document_id_b),
  CONSTRAINT duplicate_pair_labels_user_pair_key UNIQUE (user_id, document_id_a, document_id_b)
);

CREATE TABLE duplicate_user_calibration (
  user_id text PRIMARY KEY REFERENCES public."user"(id) ON DELETE CASCADE,
  logit_intercept_delta real NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
