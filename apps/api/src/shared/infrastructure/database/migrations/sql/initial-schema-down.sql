DROP TRIGGER IF EXISTS documents_search_vector_trigger ON public.documents;
DROP FUNCTION IF EXISTS public.documents_search_vector_update();

DROP TABLE IF EXISTS
  public.ml_canary_evaluations,
  public.ml_retrain_jobs,
  public.document_stack_members,
  public.document_duplicate_stacks,
  public.extraction_field_corrections,
  public.chat_messages,
  public.chat_thread_documents,
  public.chat_threads,
  public.connector_installations,
  public.extraction_arena_ratings,
  public.label_recommendation_blocklist_patterns,
  public.label_recommendation_blocklist,
  public.label_recommendation_dismissals,
  public.tag_custom_field_definitions,
  public.recognized_field_definitions,
  public.user_preferences,
  public.tag_embedding_feedback,
  public.tag_embedding_centroids,
  public.document_embeddings,
  public.document_tag_suggestions,
  public.document_tags,
  public.document_duplicate_candidates,
  public.documents,
  public.folders,
  public.mappen,
  public.tags,
  public.correspondents,
  public.ml_model_versions,
  public.ml_training_data_snapshots,
  public.ml_model_families,
  public.account,
  public.session,
  public.verification,
  public."user"
CASCADE;

DROP EXTENSION IF EXISTS pgcrypto;

