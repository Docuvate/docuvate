import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  LIBRARY_BULK_BAR_SLOT_MIN_HEIGHT,
  computeRowAnchoredMenuPosition,
  contextMenuTitleForSelection,
  resolveContextMenuSelectedIds,
} from './libraryContextMenuTarget.js';

describe('resolveContextMenuSelectedIds', () => {
  it('replaces selection when the row was not selected', () => {
    expect(resolveContextMenuSelectedIds('b', new Set(['a']))).toEqual(['b']);
  });

  it('keeps multi-selection when the row is part of it', () => {
    expect(resolveContextMenuSelectedIds('b', new Set(['a', 'b', 'c']))).toEqual(['a', 'b', 'c']);
  });

  it('uses the row alone when it was the only selected item', () => {
    expect(resolveContextMenuSelectedIds('a', new Set(['a']))).toEqual(['a']);
  });
});

describe('contextMenuTitleForSelection', () => {
  const labels = {
    singleFallback: 'Dokument',
    multiple: (count: number) => `${count} Dokumente`,
  };

  it('uses the document title for a single target', () => {
    expect(
      contextMenuTitleForSelection(['1'], [{ id: '1', title: 'Vertrag Q4' } as never], labels)
    ).toBe('Vertrag Q4');
  });

  it('uses a count label for multiple targets', () => {
    expect(contextMenuTitleForSelection(['1', '2', '3'], [], labels)).toBe('3 Dokumente');
  });
});

describe('computeRowAnchoredMenuPosition', () => {
  it('anchors vertically to the row top', () => {
    const pos = computeRowAnchoredMenuPosition(
      { top: 120, left: 0, right: 400, bottom: 160, width: 400, height: 40 },
      200,
      160,
      200,
      { width: 800, height: 600 }
    );
    expect(pos.top).toBe(120);
    expect(pos.left).toBe(200);
  });
});

describe('library bulk bar layout', () => {
  it('reserves the same min-height for empty and active slots', () => {
    const cssPath = join(dirname(fileURLToPath(import.meta.url)), '../styles/app.css');
    const css = readFileSync(cssPath, 'utf8');
    expect(css).toContain(`min-height: ${LIBRARY_BULK_BAR_SLOT_MIN_HEIGHT}`);
    expect(css).not.toMatch(/\.bulk-bar-slot-empty\s*\{[^}]*min-height:\s*0/s);
  });
});
