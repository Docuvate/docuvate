// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import type { RejectedCitedClaim } from './verify-cited-claims.js';

/** Do not rescue abstention when the model output was intentionally invalid (dump, wrong doc, etc.). */
export function rejectedClaimsAllowRetrievalFallback(
  rejected: readonly RejectedCitedClaim[]
): boolean {
  if (rejected.length === 0) {
    return false;
  }
  return rejected.every((row) => {
    switch (row.reason) {
      case 'quote_not_in_chunk':
      case 'empty_claim_text':
      case 'claim_number_not_in_quote':
      case 'unknown_source':
        return true;
      case 'quote_in_other_document':
      case 'claim_is_chunk_dump':
      case 'claim_is_index_passage':
        return false;
      default: {
        const _exhaustive: never = row.reason;
        return _exhaustive;
      }
    }
  });
}
