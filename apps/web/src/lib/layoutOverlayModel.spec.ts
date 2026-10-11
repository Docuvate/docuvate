// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LayoutIrDocument } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import {
  buildLayoutOutline,
  buildLayoutOverlays,
  buildLayoutTables,
  fieldSuggestionKeys,
} from './layoutOverlayModel';
import { layoutOverlayPercentStyles } from './pdfViewerVirtual';

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
    expect(overlays.some((o) => o.kind === 'text')).toBe(false);
  });

  it('drops unnamed empty widget overlays', () => {
    const doc: LayoutIrDocument = {
      version: 1,
      pages: [
        {
          page: 1,
          widthPt: 595,
          heightPt: 842,
          blocks: [],
          tables: [],
          widgets: [
            {
              kind: 'text',
              page: 1,
              x: 0.1,
              y: 0.7,
              width: 0.01,
              height: 0.01,
              fieldName: '',
              value: '',
            },
          ],
        },
      ],
    };
    expect(buildLayoutOverlays(doc)).toEqual([]);
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

  it('keeps overlay boxes in normalized page space for landscape and rotated pages', () => {
    const landscape: LayoutIrDocument = {
      version: 1,
      pages: [
        {
          page: 1,
          widthPt: 842,
          heightPt: 595,
          blocks: [
            {
              page: 1,
              x: 0.2,
              y: 0.3,
              width: 0.4,
              height: 0.1,
              text: 'Landscape heading',
              fontSizePt: 14,
              weight: 'bold',
              blockIndex: 0,
            },
          ],
          tables: [],
          widgets: [],
        },
      ],
    };
    const rotated: LayoutIrDocument = {
      version: 1,
      pages: [
        {
          page: 1,
          widthPt: 595,
          heightPt: 842,
          blocks: [
            {
              page: 1,
              x: 0.15,
              y: 0.55,
              width: 0.5,
              height: 0.08,
              text: 'Rotated heading',
              fontSizePt: 12,
              weight: 'bold',
              blockIndex: 1,
            },
          ],
          tables: [],
          widgets: [],
        },
      ],
    };
    const scan: LayoutIrDocument = {
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
              y: 0.12,
              width: 0.35,
              height: 0.04,
              text: 'OCR line',
              fontSizePt: 9,
              blockIndex: 2,
            },
          ],
          tables: [],
          widgets: [
            {
              kind: 'text',
              page: 1,
              x: 0.55,
              y: 0.7,
              width: 0.25,
              height: 0.03,
              fieldName: 'invoice_total',
              value: '42,00',
            },
          ],
        },
      ],
    };

    for (const doc of [landscape, rotated, scan]) {
      const overlays = buildLayoutOverlays(doc);
      expect(overlays.length).toBeGreaterThan(0);
      for (const overlay of overlays) {
        const styles = layoutOverlayPercentStyles(overlay);
        expect(styles.left).toMatch(/%$/);
        expect(styles.top).toMatch(/%$/);
        expect(parseFloat(styles.width)).toBeGreaterThan(0);
        expect(parseFloat(styles.height)).toBeGreaterThan(0);
      }
    }
  });
});
