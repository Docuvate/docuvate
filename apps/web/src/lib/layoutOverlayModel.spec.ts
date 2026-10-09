import { describe, expect, it } from 'vitest';
import type { LayoutIrDocument } from '@docuvate/contracts';
import {
  buildLayoutOutline,
  buildLayoutOverlays,
  buildLayoutTables,
  fieldSuggestionKeys,
} from './layoutOverlayModel';

const sampleDoc: LayoutIrDocument = {
  version: 1,
  pages: [
    {
      page: 1,
      widthPt: 595,
      heightPt: 842,
      blocks: [
        {
          page: 1,
          x: 0.1,
          y: 0.1,
          width: 0.8,
          height: 0.05,
          text: 'Heading line',
          fontSizePt: 13,
          weight: 'bold',
          blockIndex: 0,
        },
        {
          page: 1,
          x: 0.1,
          y: 0.2,
          width: 0.3,
          height: 0.03,
          text: 'Body text',
          fontSizePt: 8,
          blockIndex: 1,
        },
      ],
      tables: [
        {
          page: 1,
          x: 0.1,
          y: 0.3,
          width: 0.8,
          height: 0.4,
          columnCount: 2,
          rows: [
            [
              { text: '1.', x: 0, y: 0, width: 0.1, height: 0.02 },
              { text: 'Amount', x: 0.1, y: 0, width: 0.3, height: 0.02 },
            ],
          ],
        },
      ],
      widgets: [
        {
          kind: 'text',
          page: 1,
          x: 0.5,
          y: 0.5,
          width: 0.2,
          height: 0.03,
          fieldName: 'brutto',
          value: '100',
        },
      ],
    },
  ],
};

describe('layoutOverlayModel', () => {
  it('builds overlays for blocks, tables, and widgets', () => {
    const overlays = buildLayoutOverlays(sampleDoc);
    expect(overlays.some((o) => o.kind === 'heading')).toBe(true);
    expect(overlays.some((o) => o.kind === 'table')).toBe(true);
    expect(overlays.some((o) => o.kind === 'field')).toBe(true);
  });

  it('builds table views and outline entries', () => {
    const overlays = buildLayoutOverlays(sampleDoc);
    const tables = buildLayoutTables(sampleDoc, overlays);
    expect(tables).toHaveLength(1);
    expect(tables[0].rows[0][1]).toBe('Amount');
    const outline = buildLayoutOutline(sampleDoc, overlays);
    expect(outline.length).toBeGreaterThan(0);
  });

  it('lists field suggestions not in schema', () => {
    const widgets = sampleDoc.pages[0].widgets ?? [];
    const suggestions = fieldSuggestionKeys(widgets, new Set(['known']), []);
    expect(suggestions).toEqual([{ key: 'brutto', label: 'brutto', value: '100' }]);
  });
});
