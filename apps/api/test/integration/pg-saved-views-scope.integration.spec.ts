import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildSyntheticUser } from '../../../../packages/testing/src/factories/index.js';
import { ValidationError } from '../../src/shared/domain/errors.js';
import { PgWorkspaceRepository } from '../../src/modules/workspace/infrastructure/pg-workspace.repository.js';
import { SavedViewScopeValidator } from '../../src/modules/workspace/infrastructure/saved-view-scope.validator.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';

describe('Saved view filter scope (Testcontainers Postgres)', () => {
  const pool = getIntegrationPool();
  const repo = new PgWorkspaceRepository(pool);
  const scope = new SavedViewScopeValidator(pool);
  let ownerId: string;
  let otherId: string;
  let ownerTagId: string;

  beforeEach(async () => {
    ownerId = newIsolationUserId();
    otherId = newIsolationUserId();
    ownerTagId = randomUUID();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, buildSyntheticUser({ id: ownerId }));
      await insertSyntheticUser(client, buildSyntheticUser({ id: otherId }));
      await client.query(
        `INSERT INTO tags (id, user_id, name, color, is_inbox, matching_algorithm, match_text)
         VALUES ($1, $2, 'Owner tag', '#336699', false, 'none', '')`,
        [ownerTagId, ownerId]
      );
    } finally {
      client.release();
    }
  });

  afterEach(async () => {
    await deleteSyntheticUser(pool, ownerId);
    await deleteSyntheticUser(pool, otherId);
  });

  it('rejects another user tag on create', async () => {
    await expect(
      scope.assertWritableFilters(otherId, {
        searchQuery: '',
        tagIds: [ownerTagId],
      })
    ).rejects.toThrow(ValidationError);
  });

  it('clears status and document date filters on update', async () => {
    const id = randomUUID();
    await repo.createView(
      id,
      ownerId,
      {
        name: 'Filtered',
        searchQuery: '',
        status: 'ready',
        documentDateFrom: '2026-01-01',
        documentDateTo: '2026-01-31',
      },
      0
    );
    const updated = await repo.updateView(id, {
      status: null,
      documentDateFrom: null,
      documentDateTo: null,
    });
    expect(updated.status).toBeNull();
    expect(updated.documentDateFrom).toBeNull();
    expect(updated.documentDateTo).toBeNull();
  });
});

afterAll(async () => {
  await closeIntegrationPool();
});
