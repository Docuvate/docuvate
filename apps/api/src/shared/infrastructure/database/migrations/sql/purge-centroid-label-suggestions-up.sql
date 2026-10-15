-- Remove pre-hybrid embedding similarity and uncalibrated NEST label suggestions.

DELETE FROM public.document_tag_suggestions
WHERE source = 'embedding'
  AND reason LIKE 'Embedding-Ähnlichkeit%';

DELETE FROM public.document_tag_suggestions
WHERE source = 'embedding_density'
  AND coalesce(decision_tier, 'none') NOT IN ('confirm', 'auto_apply');
