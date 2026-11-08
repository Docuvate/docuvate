// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/**
 * A non-empty field suggestion still waiting for a decision.
 * Confidence is not a gate: the workbench already offers accept, correct,
 * and reject for every such row, including low-confidence ones. Label
 * suggestions keep their own calibrated floor elsewhere.
 * Column names are fixed identifiers owned by the review-queue query.
 */
export function openFieldSuggestionExistsSql(documentIdSql: string): string {
  return `EXISTS (
        SELECT 1
        FROM document_field_values v
        WHERE v.document_id = ${documentIdSql}
          AND v.field_storage_key LIKE 'suggestion:%'
          AND length(trim(v.value_text)) > 0
          AND ${suggestionRowStillOpenSql('v.document_id', 'v.field_storage_key', 'v.value_text')}
          AND NOT (
            v.field_storage_key IN ('suggestion:vendor', 'suggestion:sender', 'suggestion:correspondent')
            AND (
              v.value_text ~ '^[0-9]{1,2}[./][0-9]{1,2}[./]'
              OR v.value_text ~ '\\m[0-9]{5}\\M'
            )
          )
      )`;
}

/**
 * SQL fragment: this suggestion row is still open work.
 * Active rejects of the same review-row key (including the earlier `global:`
 * spelling) and the same whitespace/case-normalized value are excluded.
 * Column names are fixed identifiers owned by the review-queue query.
 */
export function suggestionRowStillOpenSql(
  documentIdSql: string,
  storageKeySql: string,
  valueTextSql: string
): string {
  return `NOT EXISTS (
    SELECT 1
    FROM document_field_suggestion_decisions dec
    WHERE dec.document_id = ${documentIdSql}
      AND dec.withdrawn_at IS NULL
      AND dec.decision = 'rejected'
      AND dec.value_normalized = lower(regexp_replace(btrim(${valueTextSql}), '[[:space:]]+', ' ', 'g'))
      AND (
        dec.field_key = regexp_replace(${storageKeySql}, '^suggestion:', '')
        OR (
          strpos(regexp_replace(${storageKeySql}, '^suggestion:', ''), ':') = 0
          AND dec.field_key = 'global:' || regexp_replace(${storageKeySql}, '^suggestion:', '')
        )
        OR dec.field_key = ${storageKeySql}
      )
  )`;
}
