// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** @vitest-environment jsdom */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDocumentUploadQueue } from './useDocumentUploadQueue';

const uploadDocument = vi.fn();

vi.mock('./api', () => ({
  uploadDocument: (...args: unknown[]) => uploadDocument(...args),
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

describe('useDocumentUploadQueue retry', () => {
  beforeEach(() => {
    uploadDocument.mockReset();
  });

  it('retries a failed item and marks it done', async () => {
    uploadDocument
      .mockRejectedValueOnce(new Error('upload.errorCorruptPdf'))
      .mockResolvedValueOnce({ id: 'doc-1' });

    const { result } = renderHook(() => useDocumentUploadQueue());
    const file = new File(['%PDF-broken'], 'broken.pdf', { type: 'application/pdf' });

    act(() => {
      result.current.enqueueFiles([file], { kind: 'inbox' });
    });

    await waitFor(() => {
      expect(result.current.queue[0]?.status).toBe('error');
    });

    act(() => {
      result.current.retryUploadItem(result.current.queue[0]!.id);
    });

    await waitFor(() => {
      expect(result.current.queue[0]?.status).toBe('done');
    });
    expect(uploadDocument).toHaveBeenCalledTimes(2);
  });
});
