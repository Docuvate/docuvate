// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type { LayoutIrDocument } from '@docuvate/contracts';
import { DOCUMENT_REPOSITORY, type DocumentRepository } from '../../../shared/domain/ports.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { DocumentAuthorizationService } from '../../../shared/application/document-authorization.service.js';

function parseLayoutIr(raw: Record<string, unknown>): LayoutIrDocument | null {
  if (raw['version'] !== 1 || !Array.isArray(raw['pages'])) {
    return null;
  }
  return raw as unknown as LayoutIrDocument;
}

@Injectable()
export class GetDocumentLayoutIrUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    private readonly documentAuthz: DocumentAuthorizationService
  ) {}

  async execute(
    id: string,
    userId: string,
    subject: AuthorizationSubject
  ): Promise<LayoutIrDocument> {
    const doc = await this.documents.findByIdForUser(id, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    await this.documentAuthz.assert(subject, 'document:read', doc);
    const raw = await this.documents.findLayoutIrForUser(id, userId);
    if (!raw) {
      throw new NotFoundError('LayoutIr');
    }
    const parsed = parseLayoutIr(raw);
    if (!parsed) {
      throw new NotFoundError('LayoutIr');
    }
    return parsed;
  }
}
