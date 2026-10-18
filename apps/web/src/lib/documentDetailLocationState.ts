// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractionBlock } from '@docuvate/contracts';

import { readLocationStateNumber } from './routerLocationState';

function readObjectField(obj: object, key: string): unknown {
  return Reflect.get(obj, key);
}

function isExtractionBlock(value: unknown): value is ExtractionBlock {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const page: unknown = readObjectField(value, 'page');
  const x: unknown = readObjectField(value, 'x');
  const y: unknown = readObjectField(value, 'y');
  const width: unknown = readObjectField(value, 'width');
  const height: unknown = readObjectField(value, 'height');
  const text: unknown = readObjectField(value, 'text');
  return (
    typeof page === 'number' &&
    typeof x === 'number' &&
    typeof y === 'number' &&
    typeof width === 'number' &&
    typeof height === 'number' &&
    typeof text === 'string'
  );
}

export function readHighlightBlocksFromLocationState(state: unknown): ExtractionBlock[] | undefined {
  if (typeof state !== 'object' || state === null) {
    return undefined;
  }
  if (!Object.hasOwn(state, 'highlightBlocks')) {
    return undefined;
  }
  const raw: unknown = readObjectField(state, 'highlightBlocks');
  if (!Array.isArray(raw)) {
    return undefined;
  }
  const blocks = raw.filter(isExtractionBlock);
  return blocks.length > 0 ? blocks : undefined;
}

export function readCitationPageFromLocationState(state: unknown): number | undefined {
  return readLocationStateNumber(state, 'citationPage');
}
