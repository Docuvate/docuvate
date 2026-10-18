// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, vi } from 'vitest';

import type { ObjectStorage } from '../../../shared/domain/ports.js';
import { deleteDocumentObjectKeys } from './delete-document-storage.js';

function makeStorage(deleteObject: ReturnType<typeof vi.fn>): ObjectStorage {
  return {
    putObject: vi.fn(() => Promise.resolve()),
    getObject: vi.fn(() => Promise.resolve(Buffer.alloc(0))),
    deleteObject,
  };
}

describe('deleteDocumentObjectKeys', () => {
  it('deletes primary and archived object keys when present', async () => {
    const deleteObject = vi.fn(() => Promise.resolve());
    const storage = makeStorage(deleteObject);
    await deleteDocumentObjectKeys(storage, {
      storageKey: 'users/u1/doc.pdf',
      archivedStorageKey: 'users/u1/doc-archive.pdf',
    });
    expect(deleteObject).toHaveBeenCalledTimes(2);
    expect(deleteObject).toHaveBeenCalledWith('users/u1/doc.pdf');
    expect(deleteObject).toHaveBeenCalledWith('users/u1/doc-archive.pdf');
  });

  it('deletes only the primary key when archived key is absent', async () => {
    const deleteObject = vi.fn(() => Promise.resolve());
    const storage = makeStorage(deleteObject);
    await deleteDocumentObjectKeys(storage, {
      storageKey: 'users/u1/doc.pdf',
      archivedStorageKey: null,
    });
    expect(deleteObject).toHaveBeenCalledTimes(1);
  });
});
