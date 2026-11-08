// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FieldSuggestionDecisionsResponse } from '@docuvate/contracts';
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

@Injectable()
export class ListFieldSuggestionDecisionsUseCase {
  constructor(
    private readonly authorization: DocumentAuthorizationService,
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DOCUMENT_REGION_REPOSITORY) private readonly regions: DocumentRegionRepository
  ) {}

  async execute(
    documentId: string,
    userId: string,
    subject: AuthorizationSubject
  ): Promise<FieldSuggestionDecisionsResponse> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    await this.authorization.assert(subject, 'document:read', doc);
    const items = await this.regions.listActiveFieldSuggestionRejects(documentId);
    return {
      items: items.map((item) => ({
        id: item.id,
        correctionId: item.correctionId,
        fieldKey: item.fieldKey,
        value: item.value,
        valueNormalized: item.valueNormalized,
        decision: 'rejected' as const,
        createdAt: item.createdAt,
      })),
    };
  }
}
