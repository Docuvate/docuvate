-- Remove open new-label suggestions produced by the retired vocabulary/keyword path.

DELETE FROM public.label_recommendation_dismissals
WHERE recommendation_key LIKE 'new:%'
  AND recommendation_key NOT LIKE 'new:cluster:%';

DELETE FROM public.document_tag_suggestions
WHERE source = 'rule'
  AND (
    reason = 'Im Dokumenttext erkannt'
    OR reason = 'In Titel oder Dateiname'
    OR reason LIKE 'Begriff im Dokumenttext%'
  );
