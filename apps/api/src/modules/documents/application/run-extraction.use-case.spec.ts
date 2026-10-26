// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, vi } from 'vitest';

import { RunExtractionUseCase } from './run-extraction.use-case.js';

function buildUseCase(overrides: {
  extractError?: Error;
  updateStatus?: ReturnType<typeof vi.fn>;
}): RunExtractionUseCase {
  const documents = {
    findById: vi.fn().mockResolvedValue({
      id: 'doc-1',
      userId: 'user-1',
      storageKey: 'k',
      mimeType: 'application/pdf',
      filename: 'f.pdf',
      title: 't',
      contentHash: 'hash',
    }),
    tryClaimForExtraction: vi.fn().mockResolvedValue('claimed'),
    updateStatus: overrides.updateStatus ?? vi.fn().mockResolvedValue(undefined),
    setPreviewStorageKey: vi.fn(),
    saveExtraction: vi.fn(),
    saveExtractionImages: vi.fn(),
    setHeuristicFieldExtractorVersion: vi.fn(),
  };
  const extraction = {
    extract: overrides.extractError
      ? vi.fn().mockRejectedValue(overrides.extractError)
      : vi.fn(),
  };
  return new RunExtractionUseCase(
    documents as never,
    { getObject: vi.fn().mockResolvedValue(Buffer.from('pdf')) } as never,
    extraction as never,
    { execute: vi.fn() } as never,
    { execute: vi.fn() } as never,
    { execute: vi.fn().mockResolvedValue('default') } as never,
    { execute: vi.fn() } as never,
    { execute: vi.fn() } as never,
    { loadWorkerState: vi.fn().mockResolvedValue(null) } as never,
    { listTags: vi.fn().mockResolvedValue([]) } as never,
    { execute: vi.fn().mockResolvedValue({ exactAnswers: false }) } as never,
    { execute: vi.fn() } as never,
    { execute: vi.fn() } as never,
    { execute: vi.fn() } as never
  );
}

describe('RunExtractionUseCase', () => {
  it('does not mark failed on worker 503 pressure', async () => {
    const updateStatus = vi.fn().mockResolvedValue(undefined);
    const useCase = buildUseCase({
      extractError: new Error('Worker extraction unavailable: 503'),
      updateStatus,
    });
    await expect(useCase.execute('doc-1')).rejects.toThrow('503');
    expect(updateStatus).not.toHaveBeenCalledWith('doc-1', 'failed', expect.anything());
  });
});
