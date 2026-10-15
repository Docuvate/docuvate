// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { NestFactory } from '@nestjs/core';
import pg from 'pg';

import { AppModule } from '../../apps/api/dist/app.module.js';
import { AcceptDocumentReviewBatchUseCase } from '../../apps/api/dist/modules/documents/application/document-review/accept-document-review-batch.use-case.js';
import { PromoteHighConfidenceExtractionSuggestionsUseCase } from '../../apps/api/dist/modules/documents/application/document-review/promote-extraction-suggestions.use-case.js';
import { autoPromoteMinConfidenceForField } from '../../apps/api/dist/modules/documents/domain/value-type-field-confidence.js';
import { userAuthorizationSubject } from '../../apps/api/dist/shared/infrastructure/auth/user-authorization-subject.js';

const LAB_EMAIL = process.env.DOCUVATE_TEST_EMAIL ?? 'thomas@docuvate.test';

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL required');
  }
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 2 });
  const userRow = await pool.query<{ id: string }>(
    `SELECT id FROM "user" WHERE lower(email) = lower($1) LIMIT 1`,
    [LAB_EMAIL]
  );
  const userId = userRow.rows[0]?.id;
  if (!userId) {
    throw new Error('lab user not found');
  }
  const minConfidence = Math.min(
    autoPromoteMinConfidenceForField('vendor'),
    autoPromoteMinConfidenceForField('date'),
    0.85
  );

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const promote = app.get(PromoteHighConfidenceExtractionSuggestionsUseCase);
    const docs = await pool.query<{ id: string }>(
      `SELECT id::text AS id FROM documents WHERE user_id = $1 AND status = 'ready'`,
      [userId]
    );
    for (const row of docs.rows) {
      await promote.execute(row.id, userId);
    }
    const batch = app.get(AcceptDocumentReviewBatchUseCase);
    const result = await batch.execute(userId, userAuthorizationSubject(userId), minConfidence);
    console.log(JSON.stringify({ minConfidence, ...result }, null, 2));
  } finally {
    await app.close();
    await pool.end();
  }
}

void main();
