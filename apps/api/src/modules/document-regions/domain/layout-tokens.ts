// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LayoutToken } from '@docuvate/contracts';
import { rectFromXywh } from '@docuvate/contracts';

import { isRecord, parseNumber } from '../../../shared/domain/row-parse.js';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseBlockIndex(value: unknown, fallback: number): number {
  if (isFiniteNumber(value) && Number.isInteger(value) && value >= 0) {
    return value;
  }
  return fallback;
}

function parseRotationDeg(value: unknown): number | undefined {
  if (!isFiniteNumber(value)) {
    return undefined;
  }
  if (Math.abs(value) < 0.5) {
    return undefined;
  }
  return value;
}

/** Primary reading axis for apportioning word boxes inside a block AABB. */
export function readingAxisForRotation(
  rotationDeg: number | undefined,
  blockWidth?: number,
  blockHeight?: number
): 'x' | 'y' {
  if (rotationDeg != null && Number.isFinite(rotationDeg)) {
    const folded = ((Math.abs(rotationDeg) % 180) + 180) % 180;
    if (folded > 45 && folded < 135) {
      return 'y';
    }
    return 'x';
  }
  // Fallback when glyph rotation was not recorded: tall thin AABBs are vertical runs.
  if (
    blockWidth != null &&
    blockHeight != null &&
    Number.isFinite(blockWidth) &&
    Number.isFinite(blockHeight) &&
    blockWidth > 0 &&
    blockHeight > blockWidth * 2
  ) {
    return 'y';
  }
  return 'x';
}

/**
 * Peel stuck copyright / punctuation so "©Provadis" becomes ["©", "Provadis"]
 * and "(c)Provadis" becomes ["(c)", "Provadis"]. Whitespace-split first.
 */
export function expandBlockTextPieces(text: string): string[] {
  const pieces: string[] = [];
  for (const raw of text.split(/\s+/)) {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      continue;
    }
    const stuckCopyright = /^(©|®|™|\((?:c|C)\))(.+)$/u.exec(trimmed);
    if (stuckCopyright?.[1] && stuckCopyright[2] && stuckCopyright[2].trim().length > 0) {
      pieces.push(stuckCopyright[1]);
      pieces.push(stuckCopyright[2]);
      continue;
    }
    pieces.push(trimmed);
  }
  return pieces;
}

interface WordRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  text: string;
}

function apportionWordRects(
  blockRect: { x0: number; y0: number; x1: number; y1: number },
  pieces: readonly string[],
  axis: 'x' | 'y'
): WordRect[] {
  const total = pieces.reduce((sum, piece) => sum + Math.max(1, piece.length), 0);
  const out: WordRect[] = [];
  let cursor = 0;
  for (const piece of pieces) {
    const weight = Math.max(1, piece.length);
    const start = cursor / total;
    cursor += weight;
    const end = cursor / total;
    if (axis === 'x') {
      const width = blockRect.x1 - blockRect.x0;
      out.push({
        text: piece,
        x0: blockRect.x0 + width * start,
        x1: blockRect.x0 + width * end,
        y0: blockRect.y0,
        y1: blockRect.y1,
      });
    } else {
      const height = blockRect.y1 - blockRect.y0;
      out.push({
        text: piece,
        x0: blockRect.x0,
        x1: blockRect.x1,
        y0: blockRect.y0 + height * start,
        y1: blockRect.y0 + height * end,
      });
    }
  }
  return out;
}

/** Distinct IR block indexes for persistence (PK is region_id + block_index). */
export function uniqueBlockIndexes(tokens: readonly LayoutToken[]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const token of tokens) {
    if (seen.has(token.blockIndex)) {
      continue;
    }
    seen.add(token.blockIndex);
    out.push(token.blockIndex);
  }
  return out;
}

export function layoutTokensFromIr(ir: unknown, page?: number): LayoutToken[] {
  if (!isRecord(ir) || !Array.isArray(ir.pages)) {
    return [];
  }
  const collected: {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    blockIndex: number | null;
    rotationDeg: number | undefined;
  }[] = [];
  for (const rawPage of ir.pages) {
    if (!isRecord(rawPage) || !Array.isArray(rawPage.blocks)) {
      continue;
    }
    const pageNumber = parseNumber(rawPage.page, 0);
    if (pageNumber < 1) {
      continue;
    }
    if (page != null && pageNumber !== page) {
      continue;
    }
    for (const rawBlock of rawPage.blocks) {
      if (!isRecord(rawBlock)) {
        continue;
      }
      if (
        !isFiniteNumber(rawBlock.x) ||
        !isFiniteNumber(rawBlock.y) ||
        !isFiniteNumber(rawBlock.width) ||
        !isFiniteNumber(rawBlock.height) ||
        typeof rawBlock.text !== 'string'
      ) {
        continue;
      }
      collected.push({
        page: pageNumber,
        x: rawBlock.x,
        y: rawBlock.y,
        width: rawBlock.width,
        height: rawBlock.height,
        text: rawBlock.text,
        blockIndex: isFiniteNumber(rawBlock.blockIndex) ? rawBlock.blockIndex : null,
        rotationDeg: parseRotationDeg(rawBlock.rotationDeg),
      });
    }
  }
  const nativeIndexes = collected.every((block) => block.blockIndex != null);
  const tokens: LayoutToken[] = [];
  collected.forEach((block, index) => {
    const rect = rectFromXywh(block.x, block.y, block.width, block.height);
    if (!rect) {
      return;
    }
    const blockIndex =
      nativeIndexes && block.blockIndex != null
        ? block.blockIndex
        : parseBlockIndex(block.blockIndex, index);
    const pieces = expandBlockTextPieces(block.text);
    if (pieces.length === 0) {
      return;
    }
    const axis = readingAxisForRotation(block.rotationDeg, block.width, block.height);
    const single = pieces.length === 1 ? pieces[0] : undefined;
    const wordRects =
      single !== undefined
        ? [{ x0: rect.x0, y0: rect.y0, x1: rect.x1, y1: rect.y1, text: single }]
        : apportionWordRects(rect, pieces, axis);
    for (const word of wordRects) {
      const wordRect = rectFromXywh(word.x0, word.y0, word.x1 - word.x0, word.y1 - word.y0);
      if (!wordRect) {
        continue;
      }
      const token: LayoutToken = {
        blockIndex,
        page: block.page,
        x0: wordRect.x0,
        y0: wordRect.y0,
        x1: wordRect.x1,
        y1: wordRect.y1,
        text: word.text,
      };
      if (block.rotationDeg != null) {
        token.rotationDeg = block.rotationDeg;
      }
      tokens.push(token);
    }
  });
  return tokens;
}
