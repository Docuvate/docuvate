// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import type { DocumentEntity } from '../domain/document.entity.js';
import { toDocumentListItemDto } from './document.mapper.js';

const MAX_LIST_PAYLOAD_BYTES_PER_50_ITEMS = 100 * 1024;

function heavyEntity(index: number): DocumentEntity {
  const largeText = 'x'.repeat(8_000);
  return {
    id: `doc-${String(index)}`,
    userId: 'user-1',
    filename: `file-${String(index)}.pdf`,
    title: `Document ${String(index)}`,
    status: 'ready',
    mimeType: 'application/pdf',
    fileSizeBytes: 1024,
    storageKey: `storage/${String(index)}`,
    previewStorageKey: null,
    extractionFailureReason: null,
    documentDate: new Date('2026-01-15T12:00:00.000Z'),
    notes: largeText,
    folderId: null,
    folder: null,
    tags: [
      {
        id: 'tag-1',
        userId: 'user-1',
        name: 'Invoice',
        color: '#336699',
        isInbox: false,
        matchingAlgorithm: 'none',
        match: '',
      },
    ],
    ingestSource: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    extraction: {
      text: largeText,
      fields: [{ key: 'absender', value: largeText, confidence: 0.9 }],
      blocks: [{ page: 1, x: 0, y: 0, width: 1, height: 1, text: largeText }],
      images: [],
    },
  };
}

describe('document list payload budget', () => {
  it('keeps slim list DTO under 100 KB per 50 items', () => {
    const items = Array.from({ length: 50 }, (_, index) =>
      toDocumentListItemDto(heavyEntity(index), 0, null)
    );
    const payload = JSON.stringify({ items, nextCursor: null, hasMore: false, total: 50 });
    expect(payload.length).toBeLessThan(MAX_LIST_PAYLOAD_BYTES_PER_50_ITEMS);
    for (const item of items) {
      expect(item).not.toHaveProperty('extraction');
    }
  });
});
