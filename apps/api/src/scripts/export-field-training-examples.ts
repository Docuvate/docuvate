// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import pg from 'pg';

import { ExportFieldTrainingExamplesUseCase } from '../modules/extraction-feedback/application/export-field-training-examples.use-case.js';
import { PgExtractionFieldFeedbackRepository } from '../modules/extraction-feedback/infrastructure/pg-extraction-field-feedback.repository.js';
import { PgTagCustomFieldRepository } from '../modules/labels/infrastructure/pg-tag-custom-field.repository.js';
import { PgRecognizedFieldRepository } from '../modules/recognized-fields/infrastructure/pg-recognized-field.repository.js';

/** Writes one user's field training examples as JSON lines to stdout. */
async function main(): Promise<void> {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    throw new Error('Usage: training:export-fields <email>');
  }
  const url = process.env['DATABASE_URL'];
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }
  const pool = new pg.Pool({ connectionString: url });
  try {
    const user = await pool.query<{ id: string }>(
      `SELECT id FROM "user" WHERE lower(email) = $1 LIMIT 1`,
      [email]
    );
    const userId = user.rows[0]?.id;
    if (!userId) {
      throw new Error(`No user found for email: ${email}`);
    }
    const exporter = new ExportFieldTrainingExamplesUseCase(
      new PgExtractionFieldFeedbackRepository(pool),
      new PgRecognizedFieldRepository(pool),
      new PgTagCustomFieldRepository(pool)
    );
    let count = 0;
    for await (const example of exporter.execute(userId)) {
      process.stdout.write(`${JSON.stringify(example)}\n`);
      count += 1;
    }
    process.stderr.write(`Exported ${String(count)} field training examples\n`);
  } finally {
    await pool.end();
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`training:export-fields failed: ${message}\n`);
  process.exit(1);
});
