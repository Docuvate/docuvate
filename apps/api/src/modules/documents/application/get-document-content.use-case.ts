import { Inject, Injectable } from '@nestjs/common';
import {
  DOCUMENT_REPOSITORY,
  OBJECT_STORAGE,
  type DocumentRepository,
  type ObjectStorage,
} from '../../../shared/domain/ports.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { DocumentAuthorizationService } from '../../../shared/application/document-authorization.service.js';

export interface DocumentContentResult {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

@Injectable()
export class GetDocumentContentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    private readonly documentAuthz: DocumentAuthorizationService
  ) {}

  async execute(
    id: string,
    userId: string,
    subject: AuthorizationSubject
  ): Promise<DocumentContentResult> {
    const doc = await this.documents.findByIdForUser(id, userId);
    if (!doc) throw new NotFoundError('Document');
    await this.documentAuthz.assert(subject, 'document:content:read', doc);
    const buffer = await this.storage.getObject(doc.storageKey);
    return { buffer, mimeType: doc.mimeType, filename: doc.filename };
  }
}
