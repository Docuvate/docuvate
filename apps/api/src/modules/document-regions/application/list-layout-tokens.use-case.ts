// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentLayoutTokensResponse } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { DocumentAuthorizationService } from '../../../shared/application/document-authorization.service.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import {
  DOCUMENT_REGION_REPOSITORY,
  DOCUMENT_REPOSITORY,
  type DocumentRegionRepository,
  type DocumentRepository,
} from '../../../shared/domain/ports.js';
import { layoutTokensFromIr } from '../domain/layout-tokens.js';

@Injectable()
export class ListLayoutTokensUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DOCUMENT_REGION_REPOSITORY) private readonly regions: DocumentRegionRepository,
    private readonly authorization: DocumentAuthorizationService
  ) {}

  async execute(
    documentId: string,
    userId: string,
    subject: AuthorizationSubject,
    page?: number
  ): Promise<DocumentLayoutTokensResponse> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    await this.authorization.assert(subject, 'document:read', doc);
    const snapshot = await this.regions.findLayoutIrSnapshot(documentId, userId);
    if (!snapshot) {
      return { page: page ?? null, irSha256: '', tokens: [] };
    }
    return {
      page: page ?? null,
      irSha256: snapshot.irSha256,
      tokens: layoutTokensFromIr(snapshot.ir, page),
    };
  }
}
