-- Drop heading-like heuristic vendor rows (generic rule; mirrors worker title-case / shout guards).

DELETE FROM document_field_values v
WHERE v.field_storage_key IN ('suggestion:vendor', 'vendor', 'global:vendor')
  AND NOT (v.value_text ~* '\m(GmbH|AG|UG|e\.?\s?K\.?|KG|OHG|SE|Inc\.|Ltd\.|GmbH\s*&\s*Co\.?)\M')
  AND (
    (
      length(regexp_replace(v.value_text, '[^[:alpha:]]', '', 'g')) >= 12
      AND (
        length(regexp_replace(v.value_text, '[[:upper:]]', '', 'g'))::float
        / greatest(length(regexp_replace(v.value_text, '[^[:alpha:]]', '', 'g')), 1)::float
        < 0.18
      )
    )
    OR (
      cardinality(regexp_split_to_array(trim(v.value_text), '\s+')) >= 6
      AND (
        SELECT count(*)::int
        FROM unnest(regexp_split_to_array(trim(v.value_text), '\s+')) AS w(word)
        WHERE length(word) > 2
          AND left(word, 1) ~ '[[:upper:]]'
      ) >= greatest(
        cardinality(regexp_split_to_array(trim(v.value_text), '\s+')) - 2,
        4
      )
    )
  );
