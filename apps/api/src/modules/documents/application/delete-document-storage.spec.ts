import { describe, expect, it, vi } from 'vitest';
import type { ObjectStorage } from '../../../shared/domain/ports.js';
import { deleteDocumentObjectKeys } from './delete-document-storage.js';

function makeStorage(): ObjectStorage & { deleteObject: ReturnType<typeof vi.fn> } {
  return {
    putObject: vi.fn(async () => undefined),
    getObject: vi.fn(async () => Buffer.alloc(0)),
    deleteObject: vi.fn(async () => undefined),
  };
}

describe('deleteDocumentObjectKeys', () => {
  it('deletes primary and archived object keys when present', async () => {
    const storage = makeStorage();
    await deleteDocumentObjectKeys(storage, {
      storageKey: 'users/u1/doc.pdf',
      archivedStorageKey: 'users/u1/doc-archive.pdf',
    });
    expect(storage.deleteObject).toHaveBeenCalledTimes(2);
    expect(storage.deleteObject).toHaveBeenCalledWith('users/u1/doc.pdf');
    expect(storage.deleteObject).toHaveBeenCalledWith('users/u1/doc-archive.pdf');
  });

  it('deletes only the primary key when archived key is absent', async () => {
    const storage = makeStorage();
    await deleteDocumentObjectKeys(storage, {
      storageKey: 'users/u1/doc.pdf',
      archivedStorageKey: null,
    });
    expect(storage.deleteObject).toHaveBeenCalledTimes(1);
  });
});
