// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import type { DocumentListQuery } from '@docuvate/contracts';
import type { DocumentRepository, SearchPort } from '../../../shared/domain/ports.js';
import type { DocumentEntity } from '../domain/document.entity.js';
import { DOCUMENT_REPOSITORY } from '../../../shared/domain/ports.js';

@Injectable()
export class PostgresSearchAdapter implements SearchPort {
  constructor(@Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository) {}

  async search(
    userId: string,
    query: string,
    filters: Omit<DocumentListQuery, 'q'> = {}
  ): Promise<DocumentEntity[]> {
    return this.documents.listForUser(userId, { ...filters, q: query });
  }
}
