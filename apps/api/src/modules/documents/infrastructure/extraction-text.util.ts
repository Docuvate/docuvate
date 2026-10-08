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
    const last = lines[lines.length - 1];
    if (last && Math.abs(last[0].y - block.y) <= LINE_Y_TOLERANCE) {
      last.push(block);
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
