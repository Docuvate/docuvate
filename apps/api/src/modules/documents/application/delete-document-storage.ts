// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentEntity } from '../domain/document.entity.js';
import type { ObjectStorage } from '../../../shared/domain/ports.js';

export async function deleteDocumentObjectKeys(
  storage: ObjectStorage,
  doc: Pick<DocumentEntity, 'storageKey' | 'archivedStorageKey'>
): Promise<void> {
  await storage.deleteObject(doc.storageKey);
  const archived = doc.archivedStorageKey?.trim();
  if (archived) {
    await storage.deleteObject(archived);
  }
}
