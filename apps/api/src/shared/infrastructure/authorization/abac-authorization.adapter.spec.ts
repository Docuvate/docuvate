import { describe, expect, it } from 'vitest';
import { AbacAuthorizationAdapter } from './abac-authorization.adapter.js';
import type { AuthorizationSubject } from '../../domain/authorization.js';

const owner: AuthorizationSubject = {
  kind: 'user',
  id: 'user-1',
  tenantId: 'user-1',
  roles: ['owner'],
  claims: ['document:*'],
};

const serviceRead: AuthorizationSubject = {
  kind: 'service',
  id: 'svc-a',
  tenantId: 'user-1',
  roles: ['integrator'],
  claims: ['document:read', 'document:list'],
};

const resource = {
  ownerId: 'user-1',
  status: 'ready' as const,
  tagIds: ['tag-1'],
  folderId: null,
  mappeId: null,
};

describe('AbacAuthorizationAdapter', () => {
  const adapter = new AbacAuthorizationAdapter();

  it('denies by default for unknown collection actions', async () => {
    await expect(
      adapter.authorize({ subject: serviceRead, action: 'document:delete' })
    ).resolves.toBe('deny');
  });

  it('allows owner document read', async () => {
    await expect(
      adapter.authorize({ subject: owner, action: 'document:read', resource })
    ).resolves.toBe('allow');
  });

  it('denies cross-tenant access', async () => {
    await expect(
      adapter.authorize({
        subject: { ...owner, tenantId: 'other' },
        action: 'document:read',
        resource,
      })
    ).resolves.toBe('deny');
  });

  it('requires explicit claims for service principals', async () => {
    await expect(
      adapter.authorize({ subject: serviceRead, action: 'document:chat', resource })
    ).resolves.toBe('deny');
    await expect(
      adapter.authorize({ subject: serviceRead, action: 'document:read', resource })
    ).resolves.toBe('allow');
  });
});
