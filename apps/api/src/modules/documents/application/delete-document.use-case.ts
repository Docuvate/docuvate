import { Inject, Injectable } from '@nestjs/common';
import {
  DOCUMENT_REPOSITORY,
  OBJECT_STORAGE,
  type DocumentRepository,
  type ObjectStorage,
} from '../../../shared/domain/ports.js';
import { HandleDuplicateStackDocumentDeletedUseCase } from '../../duplicates/application/duplicate-stack.use-cases.js';

@Injectable()
export class DeleteDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    private readonly handleDuplicateStackDeleted: HandleDuplicateStackDocumentDeletedUseCase
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    await this.handleDuplicateStackDeleted.execute(userId, id);
    const doc = await this.documents.deleteForUser(id, userId);
    await this.storage.deleteObject(doc.storageKey);
  }
}
