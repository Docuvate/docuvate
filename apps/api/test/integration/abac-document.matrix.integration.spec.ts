import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildSyntheticUser } from '../../../../packages/testing/src/factories/index.js';
import { PgDocumentRepository } from '../../src/modules/documents/infrastructure/pg-document.repository.js';
import { documentResourceFromEntity } from '../../src/shared/application/document-authorization.service.js';
import type { AuthorizationSubject } from '../../src/shared/domain/authorization.js';
import { AbacAuthorizationAdapter } from '../../src/shared/infrastructure/authorization/abac-authorization.adapter.js';
import {
  deleteSyntheticUser,
  insertSyntheticUser,
  newIsolationUserId,
} from './pg-test-isolation.js';
import { closeIntegrationPool, getIntegrationPool } from './pg-pool.js';

function subjectForUser(userId: string): AuthorizationSubject {
  return {
    kind: 'user',
    id: userId,
    tenantId: userId,
    roles: ['member'],
    claims: ['document:*'],
  };
}

describe('ABAC matrix (integration seed + adapter)', () => {
  const pool = getIntegrationPool();
  const documents = new PgDocumentRepository(pool);
  const abac = new AbacAuthorizationAdapter();
  let ownerId: string;
  let otherId: string;
  let documentId: string;

  beforeEach(async () => {
    ownerId = newIsolationUserId();
    otherId = newIsolationUserId();
    const client = await pool.connect();
    try {
      await insertSyntheticUser(client, buildSyntheticUser({ id: ownerId }));
      await insertSyntheticUser(client, buildSyntheticUser({ id: otherId }));
    } finally {
      client.release();
    }
    documentId = randomUUID();
    const now = new Date();
    await documents.create({
      id: documentId,
      userId: ownerId,
      filename: 'synthetic-invoice.pdf',
      title: 'Synthetic invoice',
      mimeType: 'application/pdf',
      storageKey: `fixtures/${documentId}.pdf`,
      status: 'ready',
      tags: [],
      createdAt: now,
      updatedAt: now,
    });
  });

  afterEach(async () => {
    await deleteSyntheticUser(pool, ownerId);
    await deleteSyntheticUser(pool, otherId);
  });

  it('matrix row: owner × document:read → allow; other user × document:read → deny', async () => {
    const loaded = await documents.findById(documentId);
    expect(loaded).not.toBeNull();
    const resource = documentResourceFromEntity(loaded!);

    await expect(
      abac.authorize({ subject: subjectForUser(ownerId), action: 'document:read', resource })
    ).resolves.toBe('allow');

    await expect(
      abac.authorize({ subject: subjectForUser(otherId), action: 'document:read', resource })
    ).resolves.toBe('deny');
  });

  it('matrix row: service integrator × document:chat → deny without claim', async () => {
    const loaded = await documents.findById(documentId);
    const resource = documentResourceFromEntity(loaded!);
    const service: AuthorizationSubject = {
      kind: 'service',
      id: 'svc-fixture',
      tenantId: ownerId,
      roles: ['integrator'],
      claims: ['document:read', 'document:list'],
    };
    await expect(
      abac.authorize({ subject: service, action: 'document:chat', resource })
    ).resolves.toBe('deny');
  });
});

afterAll(async () => {
  await closeIntegrationPool();
});
