// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';

import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../shared/domain/ports.js';
import { HandleDuplicateStackDocumentDeletedUseCase } from '../../duplicates/application/duplicate-stack.use-cases.js';
import { PgGlobalSearchRepository } from '../../search/infrastructure/pg-global-search.repository.js';
import { deleteDocumentObjectKeys } from './delete-document-storage.js';

@Injectable()
export class DeleteDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    private readonly handleDuplicateStackDeleted: HandleDuplicateStackDocumentDeletedUseCase,
    private readonly globalSearch: PgGlobalSearchRepository
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    await this.handleDuplicateStackDeleted.execute(userId, id);
    await this.globalSearch.releaseDocumentVocabularyForDocuments(userId, [id]);
    const doc = await this.documents.deleteForUser(id, userId);
    await deleteDocumentObjectKeys(this.storage, doc);
  }
}
