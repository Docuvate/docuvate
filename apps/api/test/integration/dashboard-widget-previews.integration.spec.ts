// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { randomUUID } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildSyntheticUser } from '../../../../packages/testing/src/factories/index.js';
import { INSTALLATION_TENANT_ID } from '../../src/modules/auth/domain/installation.constants.js';
import { PgDocumentRepository } from '../../src/modules/documents/infrastructure/pg-document.repository.js';
import { PgDuplicateRepository } from '../../src/modules/duplicates/infrastructure/pg-duplicate.repository.js';
import { PgDuplicateStackRepository } from '../../src/modules/duplicates/infrastructure/pg-duplicate-stack.repository.js';
import { GetDashboardWidgetDocumentPreviewsUseCase } from '../../src/modules/workspace/application/get-dashboard-widget-document-previews.use-case.js';
import { PgWorkspaceRepository } from '../../src/modules/workspace/infrastructure/pg-workspace.repository.js';
import { DocumentAuthorizationService } from '../../src/shared/application/document-authorization.service.js';
import type { AuthorizationPort } from '../../src/shared/domain/authorization.js';
import { getIntegrationPool } from './pg-pool.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';

describe('dashboard widget document previews', () => {
  const pool = getIntegrationPool();
  let userId: string;

  const useCase = new GetDashboardWidgetDocumentPreviewsUseCase(
    new PgDocumentRepository(pool),
    new PgDuplicateRepository(pool),
    new PgDuplicateStackRepository(pool),
    new PgWorkspaceRepository(pool),
    new DocumentAuthorizationService({
      authorize: () => Promise.resolve('allow'),
    } satisfies AuthorizationPort),
    pool
  );

  beforeEach(async () => {
    userId = newIsolationUserId();
    const user = buildSyntheticUser({ id: userId });
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, user);
      for (let i = 0; i < 3; i += 1) {
        const id = randomUUID();
        await client.query(
          `INSERT INTO documents (id, user_id, filename, title, status, storage_key, mime_type, updated_at, created_at)
           VALUES ($1, $2, $3, $4, 'ready', $5, 'application/pdf', now(), now())`,
          [id, userId, `recent-${String(i)}.pdf`, `Recent ${String(i)}`, `storage/${id}`]
        );
      }
      const failedId = randomUUID();
      await client.query(
        `INSERT INTO documents (id, user_id, filename, title, status, storage_key, mime_type, updated_at, created_at)
         VALUES ($1, $2, 'failed.pdf', 'Failed doc', 'failed', $3, 'application/pdf', now(), now())`,
        [failedId, userId, `storage/${failedId}`]
      );
    } finally {
      client.release();
    }
  });

  afterEach(async () => {
    await deleteSyntheticUser(pool, userId);
  });

  it('returns recent documents with SQL limit', async () => {
    const subject = {
      kind: 'user' as const,
      id: userId,
      tenantId: INSTALLATION_TENANT_ID,
      roles: [],
      claims: ['document:list', 'document:read'],
    };
    const result = await useCase.execute(userId, subject, {
      type: 'recent_documents',
      limit: 2,
    });
    expect(result.items).toHaveLength(2);
  });

  it('returns attention previews and count', async () => {
    const subject = {
      kind: 'user' as const,
      id: userId,
      tenantId: INSTALLATION_TENANT_ID,
      roles: [],
      claims: ['document:list', 'document:read'],
    };
    const result = await useCase.execute(userId, subject, {
      type: 'attention',
      limit: 5,
    });
    expect(result.attentionCount).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.status).toBe('failed');
  });
});
