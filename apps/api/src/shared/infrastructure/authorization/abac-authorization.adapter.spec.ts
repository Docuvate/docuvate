// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import { INSTALLATION_TENANT_ID } from '../../../modules/auth/domain/installation.constants.js';
import type { AuthorizationSubject } from '../../domain/authorization.js';
import { AbacAuthorizationAdapter } from './abac-authorization.adapter.js';

const owner: AuthorizationSubject = {
  kind: 'user',
  id: 'user-1',
  tenantId: 'user-1',
  roles: ['member'],
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

  it('denies access to another user document', async () => {
    await expect(
      adapter.authorize({
        subject: owner,
        action: 'document:read',
        resource: { ...resource, ownerId: 'other-user' },
      })
    ).resolves.toBe('deny');
  });

  it('denies when tenant scope is missing', async () => {
    await expect(
      adapter.authorize({
        subject: { ...owner, tenantId: '' },
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

  it('allows user document read when tenantId is installation scope but user id matches owner', async () => {
    const installationUser: AuthorizationSubject = {
      kind: 'user',
      id: 'user-1',
      tenantId: INSTALLATION_TENANT_ID,
      roles: ['member'],
      claims: ['document:*'],
    };
    await expect(
      adapter.authorize({ subject: installationUser, action: 'document:read', resource })
    ).resolves.toBe('allow');
  });

  it('denies service principals for another owner document', async () => {
    await expect(
      adapter.authorize({
        subject: serviceRead,
        action: 'document:read',
        resource: { ...resource, ownerId: 'other-user' },
      })
    ).resolves.toBe('deny');
  });
});
