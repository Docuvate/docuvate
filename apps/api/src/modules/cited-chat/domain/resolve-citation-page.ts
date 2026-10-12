// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractionBlock } from '@docuvate/contracts';

import { normalizeForQuoteMatch } from './verify-citation-quote.js';

/** Page of the extraction block that contains the cited quote (not chunk index default). */
export function resolveCitationPageFromBlocks(
  quote: string,
  blocks: ExtractionBlock[],
  chunkPage: number | null
): number | null {
  const needle = normalizeForQuoteMatch(quote);
  if (!needle || needle.length < 4) {
    return chunkPage;
  }

  let best: { page: number; score: number } | null = null;
  for (const block of blocks) {
    const hay = normalizeForQuoteMatch(block.text);
    if (!hay) {
      continue;
    }
    let score = 0;
    if (hay.includes(needle)) {
      score = needle.length + 100;
    } else if (needle.length >= 12) {
      const prefix = needle.slice(0, Math.min(24, needle.length));
      if (hay.includes(prefix)) {
        score = prefix.length;
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { page: block.page, score };
    }
  }
  if (best) {
    return best.page;
  }
  return chunkPage;
}
