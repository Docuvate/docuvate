-- Drop heuristic vendor suggestions that are document titles or headings, not senders.

DELETE FROM document_field_values
WHERE field_storage_key IN ('suggestion:vendor', 'vendor', 'global:vendor')
  AND (
    trim(value_text) = 'Closed-Form Document Layout Classification'
    OR value_text ~* 'synthetic layout regression document'
    OR trim(value_text) ~* '^QUERFORMAT[\s\-A-Z0-9]*FIXTURE'
    OR trim(value_text) ~* '^VERTRAGSUEBERSICHT'
    OR trim(value_text) ~* '^ANHANG\s+PREISLISTE'
  );
