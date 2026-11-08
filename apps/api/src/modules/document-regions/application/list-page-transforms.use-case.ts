// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentPageTransformsResponse } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { DocumentAuthorizationService } from '../../../shared/application/document-authorization.service.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import {
  DOCUMENT_PAGE_TRANSFORM_REPOSITORY,
  DOCUMENT_REPOSITORY,
  type DocumentPageTransformRepository,
  type DocumentRepository,
} from '../../../shared/domain/ports.js';

@Injectable()
export class ListPageTransformsUseCase {
  constructor(
    private readonly authorization: DocumentAuthorizationService,
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DOCUMENT_PAGE_TRANSFORM_REPOSITORY)
    private readonly transforms: DocumentPageTransformRepository
  ) {}

  async execute(
    documentId: string,
    userId: string,
    subject: AuthorizationSubject
  ): Promise<DocumentPageTransformsResponse> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    await this.authorization.assert(subject, 'document:read', doc);
    const transforms = await this.transforms.listForDocument(documentId);
    return { transforms };
  }
}
