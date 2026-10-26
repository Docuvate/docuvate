// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LayoutToken } from '@docuvate/contracts';
import { rectFromXywh } from '@docuvate/contracts';

import { isRecord, parseNumber } from '../../../shared/infrastructure/database/row-parse.js';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseBlockIndex(value: unknown, fallback: number): number {
  if (isFiniteNumber(value) && Number.isInteger(value) && value >= 0) {
    return value;
  }
  return fallback;
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
    tokens.push({
      blockIndex: nativeIndexes && block.blockIndex != null
        ? block.blockIndex
        : parseBlockIndex(block.blockIndex, index),
      page: block.page,
      x0: rect.x0,
      y0: rect.y0,
      x1: rect.x1,
      y1: rect.y1,
      text: block.text,
    });
  });
  return tokens;
}

export function tokensByBlockIndex(tokens: readonly LayoutToken[]): Map<number, LayoutToken> {
  const map = new Map<number, LayoutToken>();
  for (const token of tokens) {
    map.set(token.blockIndex, token);
  }
  return map;
}
