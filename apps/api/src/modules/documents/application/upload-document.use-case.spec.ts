import { describe, expect, it, vi } from 'vitest';
import { UploadDocumentUseCase, isPlainTextUploadMime } from './upload-document.use-case.js';
import { ValidationError } from '../../../shared/domain/errors.js';

function buildUseCase(overrides?: {
  create?: ReturnType<typeof vi.fn>;
  findMappe?: ReturnType<typeof vi.fn>;
}) {
  const created: { mappeId?: string | null; folderId?: string | null } = {};
  const documents = {
    create: overrides?.create ??
      vi.fn(async (doc: typeof created) => {
        Object.assign(created, doc);
        return { ...doc, id: 'doc-1', tags: [] };
      }),
    setContentHash: vi.fn(),
    findByIdForUser: vi.fn(async () => ({ id: 'doc-1', mappeId: 'm1', folderId: null, tags: [] })),
  };

  const useCase = new UploadDocumentUseCase(
    documents as never,
    { ensureInboxTag: vi.fn(async () => ({ id: 't1' })) } as never,
    { findByIdForUser: vi.fn() } as never,
    {
      findByIdForUser: overrides?.findMappe ?? vi.fn(async () => ({ id: 'm1' })),
    } as never,
    { putObject: vi.fn() } as never,
    { generate: () => 'doc-1' } as never,
    { now: () => new Date('2026-01-01') } as never,
    { execute: vi.fn() } as never,
    { execute: vi.fn() } as never
  );

  return { useCase, created, documents };
}

describe('UploadDocumentUseCase placement', () => {
  it('stores mappeId on create when uploading into an empty mappe', async () => {
    const { useCase, created } = buildUseCase();
    await useCase.execute({
      userId: 'u1',
      filename: 'a.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF'),
      mappeId: 'm1',
    });
    expect(created.mappeId).toBe('m1');
    expect(created.folderId).toBeNull();
  });

  it('rejects folder and mappe together', async () => {
    const { useCase } = buildUseCase();
    await expect(
      useCase.execute({
        userId: 'u1',
        filename: 'a.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('x'),
        folderId: 'f1',
        mappeId: 'm1',
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('isPlainTextUploadMime', () => {
  it('accepts text/plain', () => {
    expect(isPlainTextUploadMime('text/plain')).toBe(true);
    expect(isPlainTextUploadMime('text/plain; charset=utf-8')).toBe(true);
  });

  it('rejects other types', () => {
    expect(isPlainTextUploadMime('application/pdf')).toBe(false);
    expect(isPlainTextUploadMime('text/html')).toBe(false);
  });
});
