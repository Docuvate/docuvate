// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

/**
 * SQL fragment: this suggestion row is still open work.
 * Active rejects of the same review-row key (including the legacy `global:`
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
