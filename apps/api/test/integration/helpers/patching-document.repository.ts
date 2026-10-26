// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentListQuery } from '@docuvate/contracts';

import type { DocumentEntity } from '../../../src/modules/documents/domain/document.entity.js';
import { PgDocumentRepository } from '../../../src/modules/documents/infrastructure/pg-document.repository.js';

/** Simulates ORM/JS `Date` values that are invalid but truthy (F11 `toISOString` crash). */
export class InvalidDatePatchingDocumentRepository extends PgDocumentRepository {
  override async listForUser(
    userId: string,
    filters: DocumentListQuery = {}
  ): Promise<DocumentEntity[]> {
    const rows = await super.listForUser(userId, filters);
    return rows.map((doc) =>
      doc.documentDate != null ? { ...doc, documentDate: new Date(Number.NaN) } : doc
    );
  }
}
