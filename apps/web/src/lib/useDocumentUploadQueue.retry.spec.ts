// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import type { DocumentDto } from '@docuvate/contracts';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { uploadDocument } from './api';
import { useDocumentUploadQueue } from './useDocumentUploadQueue';

vi.mock('./api', () => ({
  uploadDocument: vi.fn(),
}));

vi.mock('./documentUploadAssignment', async () => {
  const actual = await vi.importActual<typeof import('./documentUploadAssignment')>(
    './documentUploadAssignment'
  );
  return {
    ...actual,
    applyDocumentUploadAssignment: vi.fn().mockResolvedValue(undefined),
  };
});

const uploadDocumentMock = vi.mocked(uploadDocument);

function stubUploadedDoc(): DocumentDto {
  return {
    id: 'doc-1',
    filename: 'broken.pdf',
    title: 'broken.pdf',
    status: 'uploaded',
    mimeType: 'application/pdf',
    fileSizeBytes: 12,
    formatBadge: 'PDF',
    previewAvailable: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
    tagSuggestions: [],
    folderId: null,
    folder: null,
    documentDate: null,
    notes: null,
  };
}

describe('useDocumentUploadQueue retry', () => {
  beforeEach(() => {
    uploadDocumentMock.mockReset();
  });

  it('retries a failed item and marks it done', async () => {
    uploadDocumentMock
      .mockRejectedValueOnce(new Error('upload.errorCorruptPdf'))
      .mockResolvedValueOnce(stubUploadedDoc());

    const { result } = renderHook(() => useDocumentUploadQueue());
    const file = new File(['%PDF-broken'], 'broken.pdf', { type: 'application/pdf' });

    act(() => {
      result.current.enqueueFiles([file], { kind: 'inbox' });
    });

    await waitFor(() => {
      expect(result.current.queue[0]?.status).toBe('error');
    });

    act(() => {
      const failedId = result.current.queue[0]?.id;
      expect(failedId).toBeDefined();
      if (failedId) {
        result.current.retryUploadItem(failedId);
      }
    });

    await waitFor(() => {
      expect(result.current.queue[0]?.status).toBe('done');
    });
    expect(uploadDocumentMock).toHaveBeenCalledTimes(2);
  });
});
