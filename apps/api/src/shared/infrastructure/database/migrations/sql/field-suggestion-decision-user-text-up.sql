-- Account ids are text (better-auth). A uuid column rejects those ids, so the
-- reject never persists and the suggestion returns after reload.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'document_field_suggestion_decisions'
      AND column_name = 'user_id'
      AND udt_name = 'uuid'
  ) THEN
    ALTER TABLE public.document_field_suggestion_decisions
      ALTER COLUMN user_id TYPE text USING user_id::text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'document_field_suggestion_decisions_user_id_fkey'
  ) THEN
    ALTER TABLE public.document_field_suggestion_decisions
      ADD CONSTRAINT document_field_suggestion_decisions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
  END IF;
END $$;
