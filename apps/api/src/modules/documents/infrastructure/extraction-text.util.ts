// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractionBlock } from '@docuvate/contracts';

const LINE_Y_TOLERANCE = 0.014;

function groupBlocksIntoLines(blocks: ExtractionBlock[], page: number): ExtractionBlock[][] {
  const sorted = [...blocks]
    .filter((b) => b.page === page)
    .sort((a, b) => {
      if (Math.abs(a.y - b.y) > LINE_Y_TOLERANCE) return a.y - b.y;
      return a.x - b.x;
    });

  const lines: ExtractionBlock[][] = [];
  for (const block of sorted) {
    const lastLine = lines.at(-1);
    if (lastLine && Math.abs(lastLine[0].y - block.y) <= LINE_Y_TOLERANCE) {
      lastLine.push(block);
    } else {
      lines.push([block]);
    }
  }
  return lines;
}

export function textFromExtractionBlocks(blocks: ExtractionBlock[]): string {
  if (blocks.length === 0) return '';
  const pages = [...new Set(blocks.map((b) => b.page))].sort((a, b) => a - b);
  const parts: string[] = [];
  for (const page of pages) {
    const lines = groupBlocksIntoLines(blocks, page);
    const pageText = lines.map((line) => line.map((b) => b.text).join(' ')).join('\n');
    if (pageText.trim()) parts.push(pageText);
  }
  return parts.join('\n\n').trim();
}
