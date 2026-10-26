// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type pg from 'pg';

import type { DocumentEntity } from '../../../src/modules/documents/domain/document.entity.js';
import { PgDocumentRepository } from '../../../src/modules/documents/infrastructure/pg-document.repository.js';
import type { DocumentListOptions } from '../../../src/shared/domain/ports.js';

/** Simulates ORM/JS `Date` values that are invalid but truthy (main F11 `toISOString` crash). */
export class InvalidDatePatchingDocumentRepository extends PgDocumentRepository {
  constructor(pool: pg.Pool) {
    super(pool);
  }

  override async listForUser(
    userId: string,
    options?: DocumentListOptions
  ): Promise<DocumentEntity[]> {
    const rows = await super.listForUser(userId, options);
    return rows.map((doc) =>
      doc.documentDate != null ? { ...doc, documentDate: new Date(Number.NaN) } : doc
    );
  }
}
