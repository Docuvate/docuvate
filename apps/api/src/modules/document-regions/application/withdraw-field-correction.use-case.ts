// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedField } from '@docuvate/contracts';
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
export class WithdrawFieldCorrectionUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DOCUMENT_REGION_REPOSITORY) private readonly regions: DocumentRegionRepository,
    private readonly authorization: DocumentAuthorizationService
  ) {}

  async execute(
    documentId: string,
    userId: string,
    subject: AuthorizationSubject,
    correctionId: string
  ): Promise<void> {
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    await this.authorization.assert(subject, 'document:write', doc);
    const correction = await this.regions.findFieldCorrection(documentId, correctionId);
    if (!correction) {
      throw new NotFoundError('Correction');
    }
    const withdrawn = await this.regions.withdrawFieldCorrection(documentId, correctionId);
    if (!withdrawn) {
      return;
    }
    if (correction.oldValue == null || !correction.fieldKey) {
      return;
    }
    const fields = doc.extraction?.fields ?? [];
    const nextFields: ExtractedField[] = [];
    let found = false;
    for (const field of fields) {
      if (field.key === correction.fieldKey) {
        nextFields.push({ ...field, value: correction.oldValue });
        found = true;
      } else {
        nextFields.push(field);
      }
    }
    if (!found && correction.op !== 'create') {
      nextFields.push({ key: correction.fieldKey, value: correction.oldValue, confidence: 1 });
    }
    if (correction.op === 'create') {
      await this.documents.updateForUser(documentId, userId, {
        extractionFields: fields.filter((field) => field.key !== correction.fieldKey),
      });
      return;
    }
    await this.documents.updateForUser(documentId, userId, { extractionFields: nextFields });
  }
}
