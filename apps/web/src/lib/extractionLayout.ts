// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractionBlock } from '@docuvate/contracts';

const LINE_Y_TOLERANCE = 0.014;

export function normalizeExtractionBlock(raw: unknown): ExtractionBlock | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const page = Number(row['page']);
  const x = Number(row['x']);
  const y = Number(row['y']);
  const width = Number(row['width']);
  const height = Number(row['height']);
  const text = String(row['text'] ?? '').trim();
  if (!Number.isFinite(page) || page < 1 || !text) return null;
  if (![x, y, width, height].every(Number.isFinite)) return null;

  const blockIndexRaw = row['blockIndex'] ?? row['block_index'];
  const blockIndex =
    blockIndexRaw === undefined || blockIndexRaw === null ? undefined : Number(blockIndexRaw);

  return {
    page,
    x: Math.min(1, Math.max(0, x)),
    y: Math.min(1, Math.max(0, y)),
    width: Math.min(1, Math.max(0, width)),
    height: Math.min(1, Math.max(0, height)),
    text,
    blockIndex: Number.isFinite(blockIndex) ? blockIndex : undefined,
  };
}

export function normalizeExtractionBlocks(raw: unknown): ExtractionBlock[] {
  if (!Array.isArray(raw)) return [];
  const out: ExtractionBlock[] = [];
  for (const item of raw) {
    const block = normalizeExtractionBlock(item);
    if (block) out.push(block);
  }
  return out;
}

export function groupBlocksIntoLines(blocks: ExtractionBlock[], page: number): ExtractionBlock[][] {
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

export function mergeBlockHighlight(blocks: ExtractionBlock[]): ExtractionBlock {
  const first = blocks[0];
  const x2 = blocks.map((b) => b.x + b.width);
  const y2 = blocks.map((b) => b.y + b.height);
  return {
    page: first.page,
    x: Math.min(...blocks.map((b) => b.x)),
    y: Math.min(...blocks.map((b) => b.y)),
    width: Math.max(...x2) - Math.min(...blocks.map((b) => b.x)),
    height: Math.max(...y2) - Math.min(...blocks.map((b) => b.y)),
    text: blocks.map((b) => b.text).join(' '),
  };
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

export function findBlockIndex(blocks: ExtractionBlock[], target: ExtractionBlock): number {
  const idx = blocks.indexOf(target);
  if (idx >= 0) return idx;
  return blocks.findIndex(
    (b) =>
      b.page === target.page &&
      b.text === target.text &&
      Math.abs(b.x - target.x) < 0.0001 &&
      Math.abs(b.y - target.y) < 0.0001
  );
}

function blockCenter(block: ExtractionBlock): { x: number; y: number } {
  return { x: block.x + block.width / 2, y: block.y + block.height / 2 };
}

function distanceToBlock(nx: number, ny: number, block: ExtractionBlock): number {
  const cx = blockCenter(block).x;
  const cy = blockCenter(block).y;
  return Math.hypot(nx - cx, ny - cy);
}

/** Pick the extraction block at normalized page coordinates (0–1), if any. */
export function findBlockAtPoint(
  blocks: ExtractionBlock[],
  page: number,
  nx: number,
  ny: number
): ExtractionBlock | null {
  const clampedX = Math.min(1, Math.max(0, nx));
  const clampedY = Math.min(1, Math.max(0, ny));
  const onPage = blocks.filter((b) => b.page === page);
  if (onPage.length === 0) return null;

  const hits = onPage.filter(
    (b) =>
      clampedX >= b.x && clampedX <= b.x + b.width && clampedY >= b.y && clampedY <= b.y + b.height
  );
  if (hits.length > 0) {
    return hits.sort((a, b) => a.width * a.height - b.width * b.height)[0] ?? null;
  }

  let best: ExtractionBlock | null = null;
  let bestDist = Infinity;
  for (const block of onPage) {
    const d = distanceToBlock(clampedX, clampedY, block);
    if (d < bestDist) {
      bestDist = d;
      best = block;
    }
  }
  const nearestThreshold = 0.08;
  return bestDist <= nearestThreshold ? best : null;
}

export function findBlockIndexAtPoint(
  blocks: ExtractionBlock[],
  page: number,
  nx: number,
  ny: number
): number {
  const block = findBlockAtPoint(blocks, page, nx, ny);
  if (!block) return -1;
  return findBlockIndex(blocks, block);
}
