// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractionBlock, NormalizedBBox } from '@docuvate/contracts';

import { normalizeForQuoteMatch } from './verify-citation-quote.js';

const MAX_BBOX_HEIGHT = 0.25;

function unionBoxes(boxes: ExtractionBlock[]): NormalizedBBox | null {
  if (boxes.length === 0) {
    return null;
  }
  let minX = boxes[0].x;
  let minY = boxes[0].y;
  let maxX = boxes[0].x + boxes[0].width;
  let maxY = boxes[0].y + boxes[0].height;
  for (const box of boxes.slice(1)) {
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  }
  const width = maxX - minX;
  const height = maxY - minY;
  if (height > MAX_BBOX_HEIGHT) {
    return null;
  }
  return { x: minX, y: minY, width, height };
}

/** Union consecutive blocks on a page whose text matches the citation quote. */
export function resolveCitationBboxFromBlocks(
  quote: string,
  blocks: ExtractionBlock[],
  page: number | null
): NormalizedBBox | null {
  const needle = normalizeForQuoteMatch(quote);
  if (!needle) {
    return null;
  }
  const pageBlocks = blocks
    .filter((block) => block.page === (page ?? 1))
    .sort((a, b) => (a.blockIndex ?? 0) - (b.blockIndex ?? 0));
  const hits = pageBlocks.filter((block) => normalizeForQuoteMatch(block.text).includes(needle));
  if (hits.length === 0) {
    return null;
  }
  return unionBoxes(hits);
}
