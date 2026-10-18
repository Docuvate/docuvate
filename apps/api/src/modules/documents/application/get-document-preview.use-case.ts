// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { documentUsesPdfPreview } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { DocumentAuthorizationService } from '../../../shared/application/document-authorization.service.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../shared/domain/ports.js';

export interface DocumentPreviewContent {
  buffer: Buffer;
  filename: string;
}

@Injectable()
export class GetDocumentPreviewUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    private readonly documentAuthz: DocumentAuthorizationService
  ) {}

  async execute(
    id: string,
    userId: string,
    subject: AuthorizationSubject
  ): Promise<DocumentPreviewContent> {
    const doc = await this.documents.findByIdForUser(id, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    await this.documentAuthz.assert(subject, 'document:content:read', doc);
    const hasPreview = Boolean(doc.previewStorageKey?.trim());
    if (!documentUsesPdfPreview(doc.mimeType, hasPreview)) {
      throw new NotFoundError('Preview');
    }
    const key = doc.previewStorageKey?.trim();
    if (!key) {
      throw new NotFoundError('Preview');
    }
    const buffer = await this.storage.getObject(key);
    const base = doc.filename.replace(/\.[^.]+$/, '') || doc.title;
    return { buffer, filename: `${base}-preview.pdf` };
  }
}
