// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  type StartedValkey,
  startValkeyContainer,
} from '../../../../packages/testing/src/containers/index.js';
import { isRecord } from '../../src/shared/infrastructure/database/row-parse.js';
import { parseJsonUnknown } from '../helpers/json.js';
import { createIntegrationNestApp } from './helpers/create-integration-nest-app.js';
import { seedLabelsRecommendationsAudit } from './helpers/seed-labels-recommendations-audit.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

async function getRecommendations(
  app: NestFastifyApplication,
  apiKeySecret: string
): Promise<{ statusCode: number; body: string }> {
  const response = await app.inject({
    method: 'GET',
    url: '/v1/labels/recommendations',
    headers: {
      'x-docuvate-api-key': apiKeySecret,
    },
  });
  return { statusCode: response.statusCode, body: response.body };
}

/**
 * Audit seed: 620 ready + 140 failed + 140 queued documents, 120 labels (~5 tags/doc),
 * mixed text/document dates, embeddings, no pre-trained hybrid model.
 * Invalid-date regression is covered in unit tests (`get-label-recommendations.main-regression.spec.ts`).
 * Before the F11 date-preview fix, `documentDate.toISOString()` yields HTTP 500 / `RangeError: Invalid time value`.
 * Production 500s without that column are usually missing migration `DocumentTagsUserConfirmed20261025210000`
 * (`document_tags.user_confirmed`); readiness checks surface pending migrations instead.
 */
describe('GET /v1/labels/recommendations (Nest + Postgres audit seed)', () => {
  const pool = getIntegrationPool();
  let valkey: StartedValkey;
  let app: NestFastifyApplication | undefined;
  let userId: string;
  let apiKeySecret: string;

  beforeAll(async () => {
    valkey = await startValkeyContainer();
    process.env.VALKEY_URL = valkey.url;
    process.env.LABEL_HYBRID_TRAIN_DEBOUNCE_MS = '0';
    process.env.LABEL_HYBRID_TRAIN_INLINE = '1';
    process.env.DOCUVATE_LABEL_HYBRID_TRAIN_BUDGET_MS = '120000';

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

    const seed = await seedLabelsRecommendationsAudit(pool, userId);
    apiKeySecret = seed.apiKeySecret;

    app = await createIntegrationNestApp();
  }, 180_000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await deleteSyntheticUser(pool, userId);
    await valkey.stop();
    delete process.env.LABEL_HYBRID_TRAIN_DEBOUNCE_MS;
    delete process.env.LABEL_HYBRID_TRAIN_INLINE;
    delete process.env.DOCUVATE_LABEL_HYBRID_TRAIN_BUDGET_MS;
    delete process.env.DOCUVATE_SERVICE_API_KEYS;
    await closeIntegrationPool();
  });

  it('returns 200 with items for ~900 documents and 120 labels', async () => {
    if (!app) {
      throw new Error('integration app not initialized');
    }
    const { statusCode, body } = await getRecommendations(app, apiKeySecret);
    expect(statusCode, body).toBe(200);
    const parsed = parseJsonUnknown(body);
    expect(isRecord(parsed) && Array.isArray(parsed.items)).toBe(true);
  });

  it('stays 200 on a second request while hybrid retrain may be in flight', async () => {
    if (!app) {
      throw new Error('integration app not initialized');
    }
    const first = await getRecommendations(app, apiKeySecret);
    const second = await getRecommendations(app, apiKeySecret);
    expect(first.statusCode, first.body).toBe(200);
    expect(second.statusCode, second.body).toBe(200);
  });
});
