// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionDto, LayoutIrDocument } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import {
  buildWorkspaceLayoutOverlays,
  buildWorkspacePdfOverlays,
  regionFieldOverlayId,
  regionIdFromFieldOverlay,
  regionIdFromTableOverlay,
  type WorkspaceOverlayLabels,
} from './workspacePdfOverlays';

const labels: WorkspaceOverlayLabels = {
  correctedTable: (ordinal) => `corrected ${ordinal}`,
  detectedTable: (index) => `table ${String(index)}`,
  field: (key) => `field ${key}`,
  unnamedField: 'field',
};

function region(partial: Partial<DocumentRegionDto> & Pick<DocumentRegionDto, 'id' | 'role'>): DocumentRegionDto {
  return {
    documentId: 'doc-1',
    page: 1,
    shape: 'rect',
    x0: 0.1,
    y0: 0.2,
    x1: 0.4,
    y1: 0.3,
    irSha256: 'abc',
    needsReview: false,
    blockIndexes: [],
    createdAt: '2026-11-07T00:00:00.000Z',
    ...partial,
  };
}

const layoutIr: LayoutIrDocument = {
  version: 1,
  pages: [
    {
      page: 1,
      widthPt: 595,
      heightPt: 842,
      blocks: [],
      tables: [
        {
          page: 1,
          x: 0.2,
          y: 0.4,
          width: 0.5,
          height: 0.2,
          columnCount: 2,
          rows: [[{ text: 'A', x: 0.2, y: 0.4, width: 0.2, height: 0.05 }]],
        },
      ],
    },
  ],
};

describe('workspace PDF overlays', () => {
  it('keeps a corrected table and a saved field as separate overlays', () => {
    const table = region({ id: 'table-1', role: 'table', x0: 0.05, y0: 0.5, x1: 0.9, y1: 0.8 });
    const field = region({
      id: 'field-1',
      role: 'field',
      field: {
        fieldKey: 'vendor',
        valueOverride: 'ACME',
      },
    });
    const layout = buildWorkspaceLayoutOverlays(layoutIr, [table]);
    const pdf = buildWorkspacePdfOverlays(layout, [field], labels);
    const corrected = pdf.find((item) => item.id === 'region-table-table-1');
    const saved = pdf.find((item) => item.id === regionFieldOverlayId('field-1'));
    const detected = pdf.find((item) => item.kind === 'table' && item.id.startsWith('table-'));
    expect(corrected).toMatchObject({ label: 'corrected 1', x: 0.05, width: 0.85 });
    expect(saved).toMatchObject({ label: 'field vendor', value: 'ACME', kind: 'field' });
    expect(detected?.label).toBe('table 1');
    expect(regionIdFromTableOverlay(corrected?.id ?? '')).toBe('table-1');
    expect(regionIdFromFieldOverlay(saved?.id ?? '')).toBe('field-1');
  });

  it('does not treat a layout-ir id as a saved region', () => {
    expect(regionIdFromFieldOverlay('widget-1-0')).toBeNull();
    expect(regionIdFromTableOverlay('table-0')).toBeNull();
  });
});
