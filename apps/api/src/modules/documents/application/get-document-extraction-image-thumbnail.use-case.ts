// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import { DocumentAuthorizationService } from '../../../shared/application/document-authorization.service.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../shared/domain/ports.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { findExtractionImageThumbnailKey } from '../infrastructure/document-extraction-images.persistence.js';

export interface DocumentExtractionImageThumbnailContent {
  buffer: Buffer;
}

@Injectable()
export class GetDocumentExtractionImageThumbnailUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    @Inject(PG_POOL) private readonly pool: pg.Pool,
    private readonly documentAuthz: DocumentAuthorizationService
  ) {}

  async execute(
    documentId: string,
    imageId: string,
    userId: string,
    subject: AuthorizationSubject
  ): Promise<DocumentExtractionImageThumbnailContent> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    await this.documentAuthz.assert(subject, 'document:content:read', doc);
    const key = await findExtractionImageThumbnailKey(this.pool, documentId, imageId, userId);
    if (!key) {
      throw new NotFoundError('Document extraction image');
    }
    const buffer = await this.storage.getObject(key);
    return { buffer };
  }
}
