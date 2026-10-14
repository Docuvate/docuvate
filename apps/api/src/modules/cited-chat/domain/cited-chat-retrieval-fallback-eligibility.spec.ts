// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0

import { describe, expect, it } from 'vitest';

import { rejectedClaimsAllowRetrievalFallback } from './cited-chat-retrieval-fallback-eligibility.js';
import type { RejectedCitedClaim } from './verify-cited-claims.js';

function rejected(reason: RejectedCitedClaim['reason']): RejectedCitedClaim {
  return {
    reason,
    claimText: 'x',
    quote: 'y',
    sourceId: 's1',
  };
}

describe('rejectedClaimsAllowRetrievalFallback', () => {
  it('allows fallback only for quote grounding failures', () => {
    expect(
      rejectedClaimsAllowRetrievalFallback([rejected('quote_not_in_chunk')])
    ).toBe(true);
    expect(
      rejectedClaimsAllowRetrievalFallback([
        rejected('quote_not_in_chunk'),
        rejected('empty_claim_text'),
      ])
    ).toBe(true);
  });

  it('blocks fallback for chunk dumps and other invalid claims', () => {
    expect(
      rejectedClaimsAllowRetrievalFallback([rejected('claim_is_chunk_dump')])
    ).toBe(false);
    expect(
      rejectedClaimsAllowRetrievalFallback([
        rejected('quote_not_in_chunk'),
        rejected('claim_is_chunk_dump'),
      ])
    ).toBe(false);
  });
});
