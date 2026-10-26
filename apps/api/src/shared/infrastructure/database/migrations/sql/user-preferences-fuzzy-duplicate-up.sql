ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS fuzzy_duplicate_detection_enabled boolean NOT NULL DEFAULT false;
