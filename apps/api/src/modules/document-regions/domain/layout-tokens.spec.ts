// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { joinedTokenText, tokensInsideRect } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import {
  expandBlockTextPieces,
  layoutTokensFromIr,
  readingAxisForRotation,
} from './layout-tokens.js';

describe('expandBlockTextPieces', () => {
  it('splits stuck copyright from the following word', () => {
    expect(expandBlockTextPieces('©Provadis')).toEqual(['©', 'Provadis']);
    expect(expandBlockTextPieces('(c)Provadis')).toEqual(['(c)', 'Provadis']);
    expect(expandBlockTextPieces('© Provadis Partner')).toEqual(['©', 'Provadis', 'Partner']);
  });
});

describe('readingAxisForRotation', () => {
  it('uses the vertical axis for quarter-turn glyph rotations', () => {
    expect(readingAxisForRotation(undefined)).toBe('x');
    expect(readingAxisForRotation(0)).toBe('x');
    expect(readingAxisForRotation(90)).toBe('y');
    expect(readingAxisForRotation(-90)).toBe('y');
    expect(readingAxisForRotation(180)).toBe('x');
  });

  it('falls back to the tall AABB axis when rotation is missing', () => {
    expect(readingAxisForRotation(undefined, 0.05, 0.4)).toBe('y');
    expect(readingAxisForRotation(undefined, 0.4, 0.05)).toBe('x');
  });
});

describe('layoutTokensFromIr word split + rotated hit test', () => {
  const ir = {
    pages: [
      {
        page: 1,
        blocks: [
          {
            blockIndex: 7,
            x: 0.1,
            y: 0.1,
            width: 0.1,
            height: 0.4,
            text: '© Provadis',
            rotationDeg: 90,
          },
        ],
      },
    ],
  };

  it('emits separate word tokens along the rotated reading axis', () => {
    const tokens = layoutTokensFromIr(ir, 1);
    expect(tokens.map((token) => token.text)).toEqual(['©', 'Provadis']);
    expect(tokens[0]?.rotationDeg).toBe(90);
    // Length-weighted split on the tall AABB: © (1 char) then Provadis (8 chars).
    expect(tokens[0]?.y1).toBeCloseTo(0.1 + 0.4 * (1 / 9), 5);
    expect(tokens[1]?.y0).toBeCloseTo(0.1 + 0.4 * (1 / 9), 5);
    expect(tokens[1]?.y1).toBeCloseTo(0.5, 5);
  });

  it('selects Provadis alone when the rectangle covers only that half', () => {
    const tokens = layoutTokensFromIr(ir, 1);
    const selected = tokensInsideRect(tokens, { x0: 0.08, y0: 0.28, x1: 0.22, y1: 0.48 });
    expect(joinedTokenText(selected)).toBe('Provadis');
    expect(selected.some((token) => token.text.includes('©'))).toBe(false);
  });

  it('splits a tall AABB without rotationDeg along the vertical axis', () => {
    const tokens = layoutTokensFromIr(
      {
        pages: [
          {
            page: 1,
            blocks: [
              {
                blockIndex: 3,
                x: 0.1,
                y: 0.1,
                width: 0.08,
                height: 0.5,
                text: '© Provadis',
              },
            ],
          },
        ],
      },
      1
    );
    expect(tokens.map((token) => token.text)).toEqual(['©', 'Provadis']);
    expect(tokens[0]?.y1).toBeCloseTo(tokens[1]?.y0 ?? -1, 9);
    expect(tokens[0]?.y1).toBeLessThan(tokens[1]?.y1 ?? 1);
    const selected = tokensInsideRect(tokens, { x0: 0.05, y0: 0.25, x1: 0.25, y1: 0.55 });
    expect(joinedTokenText(selected)).toBe('Provadis');
  });

  it('hits a thin strip across a tall rotated word via center-in-rect', () => {
    const tokens = layoutTokensFromIr(
      {
        pages: [
          {
            page: 1,
            blocks: [
              {
                blockIndex: 1,
                x: 0.4,
                y: 0.2,
                width: 0.05,
                height: 0.3,
                text: 'Toxikologie',
                rotationDeg: 90,
              },
            ],
          },
        ],
      },
      1
    );
    const selected = tokensInsideRect(tokens, { x0: 0.3, y0: 0.33, x1: 0.55, y1: 0.37 });
    expect(joinedTokenText(selected)).toBe('Toxikologie');
  });
});
