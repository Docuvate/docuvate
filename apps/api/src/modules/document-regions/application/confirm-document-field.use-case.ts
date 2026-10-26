// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ConfirmDocumentFieldResponse, ExtractedField } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { DocumentAuthorizationService } from '../../../shared/application/document-authorization.service.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import {
  DOCUMENT_REGION_REPOSITORY,
  DOCUMENT_REPOSITORY,
  type DocumentRegionRepository,
  type DocumentRepository,
} from '../../../shared/domain/ports.js';
import { hashFieldValueBytes, hashFieldValueHex } from '../domain/ir-hash.js';

@Injectable()
export class ConfirmDocumentFieldUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(DOCUMENT_REGION_REPOSITORY) private readonly regions: DocumentRegionRepository,
    private readonly authorization: DocumentAuthorizationService
  ) {}

  async execute(
    documentId: string,
    userId: string,
    subject: AuthorizationSubject,
    fieldKey: string,
    value: string
  ): Promise<ConfirmDocumentFieldResponse> {
    const key = fieldKey.trim();
    if (!key) {
      throw new ValidationError('documents.fieldKeyRequired');
    }
    const doc = await this.documents.findByIdForUser(documentId, userId);
    if (!doc) {
      throw new NotFoundError('Document');
    }
    await this.authorization.assert(subject, 'document:write', doc);
    const fields = doc.extraction?.fields ?? [];
    const current = fields.find((field) => field.key === key);
    if (!current) {
      throw new NotFoundError('Field');
    }
    const confirmedValue = value.trim() || current.value;
    const valueSha256 = hashFieldValueBytes(confirmedValue);
    await this.regions.confirmField({
      documentId,
      userId,
      fieldKey: key,
      valueSha256,
      fieldTagId: current.tagId ?? null,
    });
    const nextFields: ExtractedField[] = fields.map((field) =>
      field.key === key ? { ...field, value: confirmedValue, confidence: 1 } : field
    );
    await this.documents.updateForUser(documentId, userId, { extractionFields: nextFields });
    return {
      confirmed: true,
      fieldKey: key,
      valueSha256: hashFieldValueHex(confirmedValue),
    };
  }
}
