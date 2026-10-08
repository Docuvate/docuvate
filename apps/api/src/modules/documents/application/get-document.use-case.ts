import { Inject, Injectable } from '@nestjs/common';
import { DOCUMENT_REPOSITORY, type DocumentRepository } from '../../../shared/domain/ports.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { DocumentAuthorizationService } from '../../../shared/application/document-authorization.service.js';
import type { DocumentEntity } from '../domain/document.entity.js';

@Injectable()
export class GetDocumentUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    private readonly documentAuthz: DocumentAuthorizationService
  ) {}

  async execute(
    id: string,
    userId: string,
    subject: AuthorizationSubject
  ): Promise<DocumentEntity> {
    const doc = await this.documents.findByIdForUser(id, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    await this.documentAuthz.assert(subject, 'document:read', doc);
    return doc;
  }
}
