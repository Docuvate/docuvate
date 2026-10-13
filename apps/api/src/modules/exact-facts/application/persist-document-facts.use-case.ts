// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractedFactDto } from '@docuvate/contracts';
import { Injectable } from '@nestjs/common';

import { PgDocumentExtractedFactRepository } from '../infrastructure/pg-document-extracted-fact.repository.js';

@Injectable()
export class PersistDocumentFactsUseCase {
  constructor(private readonly repository: PgDocumentExtractedFactRepository) {}

  async execute(
    tenantId: string,
    documentId: string,
    facts: ExtractedFactDto[],
    wallTimeMs: number | null
  ): Promise<void> {
    await this.repository.replaceForDocument(tenantId, documentId, facts, wallTimeMs);
  }
}
