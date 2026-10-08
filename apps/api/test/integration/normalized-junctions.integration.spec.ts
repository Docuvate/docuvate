import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PgRecognizedFieldRepository } from '../../src/modules/recognized-fields/infrastructure/pg-recognized-field.repository.js';
import { PgUserPreferencesRepository } from '../../src/modules/settings/infrastructure/pg-user-preferences.repository.js';
import { PgExtractionFieldFeedbackRepository } from '../../src/modules/extraction-feedback/infrastructure/pg-extraction-field-feedback.repository.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import { deleteSyntheticUser, insertSyntheticUser, newIsolationUserId } from './pg-test-isolation.js';

/** Label sets and engine lists are junction tables (ADR 015); repositories read and write them. */
describe('normalized junction tables (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  let userId: string;
  let otherUserId: string;
  const tagA = randomUUID();
  const tagB = randomUUID();
  const foreignTag = randomUUID();
  const documentId = randomUUID();

  beforeAll(async () => {
    userId = newIsolationUserId();
    otherUserId = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, { id: userId, name: 'J', email: `${userId}@example.test` });
      await insertSyntheticUser(client, {
        id: otherUserId,
        name: 'K',
        email: `${otherUserId}@example.test`,
      });
    } finally {
      client.release();
    }
    await pool.query(
      `INSERT INTO tags (id, user_id, name) VALUES ($1, $3, 'Rechnung'), ($2, $3, 'Vertrag'), ($4, $5, 'Fremd')`,
      [tagA, tagB, userId, foreignTag, otherUserId]
    );
    await pool.query(
      `INSERT INTO documents (id, user_id, filename, mime_type, storage_key, status)
       VALUES ($1, $2, 'j.pdf', 'application/pdf', 'k', 'ready')`,
      [documentId, userId]
    );
  }, 60_000);

  afterAll(async () => {
    await deleteSyntheticUser(pool, userId);
    await deleteSyntheticUser(pool, otherUserId);
    await closeIntegrationPool();
  });

  it('stores recognized field gate labels and ignores foreign or unknown ids', async () => {
    const repo = new PgRecognizedFieldRepository(pool);
    const saved = await repo.replaceForUser(userId, [
      {
        key: 'betrag',
        label: 'Betrag',
        fieldType: 'currency',
        sortOrder: 0,
        extractForAllDocuments: false,
        gateLabelIds: [tagB, tagA, tagA, foreignTag, 'not-a-uuid'],
        gateLabelMatch: 'any',
        minLabelConfidence: null,
        confidenceGateEnabled: null,
      },
    ]);
    expect(saved[0]?.gateLabelIds).toEqual([tagA, tagB].sort());

    const replaced = await repo.replaceForUser(userId, [
      {
        key: 'betrag',
        label: 'Betrag',
        fieldType: 'currency',
        sortOrder: 0,
        extractForAllDocuments: false,
        gateLabelIds: [],
        gateLabelMatch: 'all',
        minLabelConfidence: null,
        confidenceGateEnabled: null,
      },
    ]);
    expect(replaced[0]?.gateLabelIds).toEqual([]);
  });

  it('stores required labels in user preferences', async () => {
    const repo = new PgUserPreferencesRepository(pool);
    const saved = await repo.upsert(userId, {
      fieldExtractionRequiredLabelIds: [tagA, foreignTag],
    });
    expect(saved.fieldExtractionRequiredLabelIds).toEqual([tagA]);
  });

  it('stores correction labels and arena engines', async () => {
    const feedback = new PgExtractionFieldFeedbackRepository(pool);
    await feedback.insertMany(userId, [
      {
        documentId,
        fieldKey: 'global:betrag',
        oldValue: '12',
        newValue: '12,50',
        labelTagIds: [tagB, foreignTag],
        fieldTagId: null,
      },
    ]);
    const corrections = await feedback.listForUser(userId);
    expect(corrections[0]?.labelTagIds).toEqual([tagB]);

    const prefs = new PgUserPreferencesRepository(pool);
    await prefs.recordArenaRating({
      userId,
      documentId,
      winnerEngine: 'docling',
      comparedEngines: ['docling', ' pipeline ', ''],
    });
    const engines = await pool.query(
      `SELECT e.engine_name, e.sort_order
       FROM extraction_arena_rating_compared_engines e
       JOIN extraction_arena_ratings r ON r.id = e.rating_id
       WHERE r.user_id = $1
       ORDER BY e.sort_order`,
      [userId]
    );
    expect(engines.rows).toEqual([
      { engine_name: 'docling', sort_order: 0 },
      { engine_name: 'pipeline', sort_order: 1 },
    ]);
  });
});
