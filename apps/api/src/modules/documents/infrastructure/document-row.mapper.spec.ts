// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { mapDocumentRow, normalizeExtraction } from './document-row.mapper.js';

describe('mapDocumentRow extraction markdown', () => {
  it('maps extracted_markdown onto extraction.markdown', () => {
    const entity = mapDocumentRow({
      id: 'doc-1',
      user_id: 'user-1',
      filename: 'a.pdf',
      title: 'a.pdf',
      mime_type: 'application/pdf',
      storage_key: 'k',
      status: 'ready',
      extracted_text: 'plain',
      extracted_markdown: '## Title\n\nBody',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    expect(entity.extraction?.text).toBe('plain');
    expect(entity.extraction?.markdown).toBe('## Title\n\nBody');
  });

  it('sets layoutIrAvailable when layout_ir_available is true', () => {
    const entity = mapDocumentRow(
      {
        id: 'd1',
        user_id: 'u1',
        filename: 'f.pdf',
        title: 'T',
        mime_type: 'application/pdf',
        storage_key: 'k',
        status: 'ready',
        extracted_text: 'plain',
        layout_ir_available: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      { extraction: { fields: [], blocks: [] } }
    );
    expect(entity.extraction?.layoutIrAvailable).toBe(true);
  });

  it('omits markdown when column is blank', () => {
    const entity = mapDocumentRow({
      id: 'doc-1',
      user_id: 'user-1',
      filename: 'a.pdf',
      title: 'a.pdf',
      mime_type: 'application/pdf',
      storage_key: 'k',
      status: 'ready',
      extracted_text: 'plain',
      extracted_markdown: '   ',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    expect(entity.extraction?.markdown).toBeUndefined();
  });
});

describe('normalizeExtraction', () => {
  it('dedupes fields and drops invalid blocks', () => {
    const result = normalizeExtraction({
      fields: [
        { key: 'betrag', value: '10' },
        { key: 'betrag', value: '12', confidence: 0.9 },
      ],
      blocks: [
        { page: 1, x: 0.1, y: 0.2, width: 0.3, height: 0.1, text: ' Rechnung ' },
        { page: 0, x: 0, y: 0, width: 0, height: 0, text: 'invalid page' },
        { page: 1, x: 1.4, y: 0, width: 0.2, height: 0.2, text: 'clamped' },
      ],
    });
    expect(result.fields).toHaveLength(1);
    expect(result.blocks.map((b) => b.text)).toEqual(['Rechnung', 'clamped']);
    expect(result.blocks[1]?.x).toBe(1);
  });

  it('returns empty lists when nothing is stored', () => {
    expect(normalizeExtraction(undefined)).toEqual({ fields: [], blocks: [] });
  });
});
