import { describe, expect, it } from 'vitest';
import { mapDocumentRow } from './document-row.mapper.js';

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
      extracted_fields: JSON.stringify({ fields: [], blocks: [] }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    expect(entity.extraction?.text).toBe('plain');
    expect(entity.extraction?.markdown).toBe('## Title\n\nBody');
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
      extracted_fields: JSON.stringify({ fields: [], blocks: [] }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    expect(entity.extraction?.markdown).toBeUndefined();
  });
});
