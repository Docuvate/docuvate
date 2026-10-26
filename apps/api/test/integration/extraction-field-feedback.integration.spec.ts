// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { RecordExtractionFieldCorrectionsUseCase } from '../../src/modules/extraction-feedback/application/record-extraction-field-corrections.use-case.js';
import { PgDocumentRepository } from '../../src/modules/documents/infrastructure/pg-document.repository.js';
import { PgExtractionFieldFeedbackRepository } from '../../src/modules/extraction-feedback/infrastructure/pg-extraction-field-feedback.repository.js';
import { PgTaxonomyRepository } from '../../src/modules/taxonomy/infrastructure/pg-taxonomy.repository.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

describe('extraction field feedback (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let userId: string;
  const documentId = randomUUID();
  let recordFeedback: RecordExtractionFieldCorrectionsUseCase;

  beforeAll(async () => {
    userId = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, { id: userId, name: 'F', email: `${userId}@example.test` });
    } finally {
      client.release();
    }
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, mime_type, storage_key, status)
       VALUES ($1, $2, 'f.pdf', 'application/pdf', 'k', 'ready')`,
      [documentId, userId]
    );
    const documents = new PgDocumentRepository(pool);
    const taxonomy = new PgTaxonomyRepository(pool);
    const feedback = new PgExtractionFieldFeedbackRepository(pool);
    recordFeedback = new RecordExtractionFieldCorrectionsUseCase(documents, taxonomy, feedback);
  }, 60_000);

  afterAll(async () => {
    await deleteSyntheticUser(pool, userId);
    await closeIntegrationPool();
  });

  async function saveFields(fields: { key: string; value: string; confidence?: number }[]) {
    const repo = new PgDocumentRepository(pool);
    await repo.updateForUser(documentId, userId, { extractionFields: fields });
  }

  it('records confirmations without corrections for confidence-only updates', async () => {
    await saveFields([
      { key: 'global:absender', value: 'Nordwind GmbH', confidence: 0.7 },
      { key: 'global:rechnungsdatum', value: '15.03.2024', confidence: 0.75 },
    ]);
    const result = await recordFeedback.execute(
      documentId,
      userId,
      [
        { key: 'global:absender', value: 'Nordwind GmbH', confidence: 0.7 },
        { key: 'global:rechnungsdatum', value: '15.03.2024', confidence: 0.75 },
      ],
      [
        { key: 'global:absender', value: 'Nordwind GmbH', confidence: 1 },
        { key: 'global:rechnungsdatum', value: '15.03.2024', confidence: 1 },
      ]
    );
    expect(result).toEqual({ correctionsRecorded: 0, confirmationsRecorded: 2 });

    const repeat = await recordFeedback.execute(
      documentId,
      userId,
      [
        { key: 'global:absender', value: 'Nordwind GmbH', confidence: 1 },
        { key: 'global:rechnungsdatum', value: '15.03.2024', confidence: 1 },
      ],
      [
        { key: 'global:absender', value: 'Nordwind GmbH', confidence: 1 },
        { key: 'global:rechnungsdatum', value: '15.03.2024', confidence: 1 },
      ]
    );
    expect(repeat).toEqual({ correctionsRecorded: 0, confirmationsRecorded: 0 });

    const correctionCount = await pool.query<{ c: number }>(
      `SELECT COUNT(*)::int AS c FROM extraction_field_corrections WHERE document_id = $1`,
      [documentId]
    );
    expect(correctionCount.rows[0]?.c).toBe(0);
    const confirmationCount = await pool.query<{ c: number }>(
      `SELECT COUNT(*)::int AS c FROM extraction_field_confirmations WHERE document_id = $1`,
      [documentId]
    );
    expect(confirmationCount.rows[0]?.c).toBe(2);
  });

  it('stores real corrections once and ignores equivalent re-saves', async () => {
    await saveFields([{ key: 'global:absender', value: 'Nordwind GmbH', confidence: 1 }]);
    const before = [{ key: 'global:absender', value: 'Nordwind GmbH', confidence: 1 }];
    const after = [{ key: 'global:absender', value: 'Südwind AG', confidence: 1 }];
    const first = await recordFeedback.execute(documentId, userId, before, after);
    expect(first.correctionsRecorded).toBe(1);
    const second = await recordFeedback.execute(documentId, userId, after, after);
    expect(second.correctionsRecorded).toBe(0);

    const rows = await pool.query<{ c: number }>(
      `SELECT COUNT(*)::int AS c FROM extraction_field_corrections
       WHERE document_id = $1 AND field_key = 'global:absender'`,
      [documentId]
    );
    expect(rows.rows[0]?.c).toBe(1);
  });

  it('does not treat date format normalization as a correction', async () => {
    const isoDoc = randomUUID();
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, mime_type, storage_key, status)
       VALUES ($1, $2, 'd.pdf', 'application/pdf', 'k2', 'ready')`,
      [isoDoc, userId]
    );
    await new PgDocumentRepository(pool).updateForUser(isoDoc, userId, {
      extractionFields: [{ key: 'global:rechnungsdatum', value: '2024-03-15', confidence: 0.8 }],
    });
    const result = await recordFeedback.execute(
      isoDoc,
      userId,
      [{ key: 'global:rechnungsdatum', value: '2024-03-15', confidence: 0.8 }],
      [{ key: 'global:rechnungsdatum', value: '15.03.2024', confidence: 1 }]
    );
    expect(result.correctionsRecorded).toBe(0);
    expect(result.confirmationsRecorded).toBe(1);
  });
});
