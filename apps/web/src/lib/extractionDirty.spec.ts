// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractionBlock } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import { extractionBlocksForUpdate } from './extractionDirty';

const block = (text: string): ExtractionBlock => ({
  page: 1,
  x: 0,
  y: 0,
  width: 1,
  height: 1,
  text,
});

describe('extractionBlocksForUpdate', () => {
  it('omits unchanged blocks so a field save keeps the layout', () => {
    const blocks = [block('a')];
    expect(extractionBlocksForUpdate(undefined, blocks, [block('a')])).toBeUndefined();
  });

  it('sends edited blocks', () => {
    const blocks = [block('b')];
    expect(extractionBlocksForUpdate(undefined, blocks, [block('a')])).toBe(blocks);
  });

  it('always sends explicitly patched blocks', () => {
    const patch = [block('a')];
    expect(extractionBlocksForUpdate(patch, [block('a')], [block('a')])).toBe(patch);
  });
});
