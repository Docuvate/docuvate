// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  type StartedValkey,
  startValkeyContainer,
} from '../../../../packages/testing/src/containers/index.js';
import { GetLabelRecommendationsUseCase } from '../../src/modules/labels/application/get-label-recommendations.use-case.js';
import { createLabelsRecommendationsUseCase } from './helpers/create-labels-recommendations-use-case.js';
import { seedLabelsRecommendationsAudit } from './helpers/seed-labels-recommendations-audit.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

vi.setConfig({ hookTimeout: 300_000 });

/**
 * Audit seed: 620 ready + 140 failed + 140 queued documents, 120 labels (~5 tags/doc),
 * mixed text/document dates, embeddings, no pre-trained hybrid model.
 * Invalid-date regression is covered in unit tests (`get-label-recommendations.main-regression.spec.ts`).
 * Production 500s without `document_tags.user_confirmed` mean migration
 * `DocumentTagsUserConfirmed20261025210000` is pending (see migration readiness checks).
 */
describe('GET /v1/labels/recommendations (LabelsModule + Postgres audit seed)', () => {
  const pool = getIntegrationPool();
  let valkey: StartedValkey;
  let recommendations: GetLabelRecommendationsUseCase;
  let userId: string;

  beforeAll(async () => {
    valkey = await startValkeyContainer();
    process.env.VALKEY_URL = valkey.url;
    userId = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, {
        id: userId,
        name: 'Labels audit',
        email: `${userId}@example.test`,
      });
    } finally {
      client.release();
    }

    await seedLabelsRecommendationsAudit(pool, userId);
    recommendations = await createLabelsRecommendationsUseCase();
  }, 180_000);

  afterAll(async () => {
    await deleteSyntheticUser(pool, userId);
    await valkey.stop();
    delete process.env.DOCUVATE_SERVICE_API_KEYS;
    await closeIntegrationPool();
  });

  it('returns recommendations for ~900 documents and 120 labels', async () => {
    const { items, state } = await recommendations.execute(userId);
    expect(Array.isArray(items)).toBe(true);
    expect(state).toBe('ready');
  });
});
