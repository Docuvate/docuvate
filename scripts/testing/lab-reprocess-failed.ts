// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { NestFactory } from '@nestjs/core';
import pg from 'pg';

import { AppModule } from '../../apps/api/dist/app.module.js';
import { RunExtractionUseCase } from '../../apps/api/dist/modules/documents/application/run-extraction.use-case.js';

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
  const failed = await pool.query<{ id: string }>(
    `SELECT id::text AS id FROM documents WHERE user_id = $1 AND status = 'failed'`,
    [userId]
  );

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const runExtraction = app.get(RunExtractionUseCase);
    const results: { id: string; ok: boolean; error?: string }[] = [];
    for (const row of failed.rows) {
      try {
        await runExtraction.execute(row.id, userId);
        results.push({ id: row.id, ok: true });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        results.push({ id: row.id, ok: false, error: message });
      }
    }
    console.log(JSON.stringify({ processed: results.length, results }, null, 2));
  } finally {
    await app.close();
    await pool.end();
  }
}

void main();
