// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { NestFactory } from '@nestjs/core';
import pg from 'pg';

import { AppModule } from '../../apps/api/dist/app.module.js';
import { RefreshHeuristicFieldSuggestionsUseCase } from '../../apps/api/dist/modules/documents/application/refresh-heuristic-field-suggestions.use-case.js';
import { ApplyEmbeddingSuggestionsUseCase } from '../../apps/api/dist/modules/labels/application/apply-embedding-suggestions.use-case.js';
import { RebuildDocumentFactIndexUseCase } from '../../apps/api/dist/modules/exact-facts/application/rebuild-document-fact-index.use-case.js';

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
  const docs = await pool.query<{ id: string; extracted_text: string | null }>(
    `SELECT id::text AS id, extracted_text FROM documents WHERE user_id = $1 AND status = 'ready'`,
    [userId]
  );

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const refreshHeuristic = app.get(RefreshHeuristicFieldSuggestionsUseCase);
    const rebuildFacts = app.get(RebuildDocumentFactIndexUseCase);
    const applyEmbedding = app.get(ApplyEmbeddingSuggestionsUseCase);
    let heuristic = 0;
    let facts = 0;
    let embedding = 0;
    for (const doc of docs.rows) {
      await refreshHeuristic.execute(doc.id, userId);
      heuristic += 1;
      await rebuildFacts.execute(doc.id, userId);
      facts += 1;
      const text = doc.extracted_text?.trim() ?? '';
      if (text.length >= 20) {
        await applyEmbedding.execute(doc.id, userId, text);
        embedding += 1;
      }
    }
    console.log(JSON.stringify({ heuristic, facts, embedding, documents: docs.rowCount }, null, 2));
  } finally {
    await app.close();
    await pool.end();
  }
}

void main();
