// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentBulkRequest } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  FOLDER_REPOSITORY,
  type FolderRepository,
  OBJECT_STORAGE,
  type ObjectStorage,
  TAXONOMY_REPOSITORY,
  type TaxonomyRepository,
} from '../../../shared/domain/ports.js';
import { deleteDocumentObjectKeys } from './delete-document-storage.js';

@Injectable()
export class BulkDocumentsUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    @Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage
  ) {}

  async execute(userId: string, body: DocumentBulkRequest): Promise<{ affected: number }> {
    const ids = [...new Set(body.ids)];
    if (ids.length === 0) throw new ValidationError('No document ids provided');

    const bulk = body.bulk;
    switch (bulk.action) {
      case 'addTag': {
        const tag = await this.taxonomy.findTagByIdForUser(bulk.tagId, userId);
        if (!tag) throw new NotFoundError('Tag');
        const affected = await this.documents.addTagToDocuments(userId, ids, bulk.tagId);
        return { affected };
      }
      case 'removeTag': {
        const tag = await this.taxonomy.findTagByIdForUser(bulk.tagId, userId);
        if (!tag) throw new NotFoundError('Tag');
        const affected = await this.documents.removeTagFromDocuments(userId, ids, bulk.tagId);
        return { affected };
      }
      case 'setCorrespondent': {
        if (bulk.correspondentId) {
          const c = await this.taxonomy.findCorrespondentByIdForUser(bulk.correspondentId, userId);
          if (!c) throw new NotFoundError('Correspondent');
        }
        const affected = await this.documents.setCorrespondentForDocuments(
          userId,
          ids,
          bulk.correspondentId
        );
        return { affected };
      }
      case 'setFolder': {
        if (bulk.folderId) {
          const folder = await this.folders.findByIdForUser(bulk.folderId, userId);
          if (!folder) throw new NotFoundError('Folder');
        }
        const affected = await this.documents.setFolderForDocuments(userId, ids, bulk.folderId);
        return { affected };
      }
      case 'delete': {
        const deleted = await this.documents.deleteDocuments(userId, ids);
        await Promise.all(deleted.map((d) => deleteDocumentObjectKeys(this.storage, d)));
        return { affected: deleted.length };
      }
      default:
        throw new ValidationError('Unknown bulk action');
    }
  }
}
