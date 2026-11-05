// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentListQuery } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { DocumentAuthorizationService } from '../../../shared/application/document-authorization.service.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { ValidationError } from '../../../shared/domain/errors.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from '../../../shared/domain/ports.js';
import type { DocumentEntity } from '../domain/document.entity.js';
import {
  type FieldValuesExportFormat,
  fieldValuesExportContentType,
  fieldValuesExportFilename,
  serializeFieldValuesCsv,
  serializeFieldValuesJson,
} from '../domain/field-values-export.js';

/** Soft cap so a mistaken full-library export cannot OOM the API process. */
const FIELD_VALUES_EXPORT_MAX_DOCUMENTS = 5000;

interface ExportDocumentFieldValuesResult {
  body: string;
  contentType: string;
  filename: string;
}

@Injectable()
export class ExportDocumentFieldValuesUseCase {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    private readonly documentAuthz: DocumentAuthorizationService
  ) {}

  async execute(
    userId: string,
    subject: AuthorizationSubject,
    format: FieldValuesExportFormat,
    filters: DocumentListQuery = {},
    documentIds?: readonly string[]
  ): Promise<ExportDocumentFieldValuesResult> {
    await this.documentAuthz.assertCollection(subject, 'document:list');

    const ids = await this.resolveDocumentIds(userId, subject, filters, documentIds);

    if (ids.length > FIELD_VALUES_EXPORT_MAX_DOCUMENTS) {
      throw new ValidationError(
        `Export begrenzt auf ${String(FIELD_VALUES_EXPORT_MAX_DOCUMENTS)} Dokumente. Bitte Filter eingrenzen.`
      );
    }

    const rows = await this.documents.listFieldValuesForDocuments(userId, ids);
    const stamp = new Date().toISOString().slice(0, 10);
    const body =
      format === 'csv' ? serializeFieldValuesCsv(rows) : serializeFieldValuesJson(rows);
    return {
      body,
      contentType: fieldValuesExportContentType(format),
      filename: fieldValuesExportFilename(format, stamp),
    };
  }

  private async resolveDocumentIds(
    userId: string,
    subject: AuthorizationSubject,
    filters: DocumentListQuery,
    documentIds: readonly string[] | undefined
  ): Promise<string[]> {
    if (documentIds != null && documentIds.length > 0) {
      const owned = await this.documents.filterOwnedDocumentIds(userId, [...documentIds]);
      const entities: DocumentEntity[] = [];
      for (const id of owned) {
        const doc = await this.documents.findByIdForUser(id, userId);
        if (doc != null) {
          entities.push(doc);
        }
      }
      const allowed = await this.documentAuthz.filterDocuments(subject, entities);
      return allowed.map((doc) => doc.id);
    }

    const exportFilters: DocumentListQuery = { ...filters };
    delete exportFilters.limit;
    delete exportFilters.cursor;
    const entities = await this.documents.listForUser(userId, exportFilters);
    const allowed = await this.documentAuthz.filterDocuments(subject, entities);
    return allowed.map((doc) => doc.id);
  }
}
