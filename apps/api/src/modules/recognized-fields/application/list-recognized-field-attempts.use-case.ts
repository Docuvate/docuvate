// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { RecognizedFieldExtractionAttemptDto } from '@docuvate/contracts';
import { Injectable } from '@nestjs/common';

import { PgRecognizedFieldExtractionAttemptRepository } from '../infrastructure/pg-recognized-field-extraction-attempt.repository.js';

@Injectable()
export class ListRecognizedFieldAttemptsUseCase {
  constructor(private readonly attempts: PgRecognizedFieldExtractionAttemptRepository) {}

  async execute(documentId: string, userId: string): Promise<RecognizedFieldExtractionAttemptDto[]> {
    const rows = await this.attempts.listForDocument(documentId, userId);
    return rows.map((row) => ({
      fieldDefinitionId: row.fieldDefinitionId,
      fieldKey: row.fieldKey,
      outcome: row.outcome,
      confidence: row.confidence,
      updatedAt: row.updatedAt.toISOString(),
    }));
  }
}
