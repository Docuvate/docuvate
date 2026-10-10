// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { ForbiddenError } from '../../../shared/domain/errors.js';
import { INSTALLATION_TENANT_ID } from './installation.constants.js';
import {
  assertInstallationInviteRoleAllowed,
  canPerformInstallationAction,
} from './installation-authorization.js';
import { INSTANCE_ROLE_ADMIN, INSTANCE_ROLE_MEMBER } from './instance-role.constants.js';

const adminSubject: AuthorizationSubject = {
  kind: 'user',
  id: 'admin-1',
  tenantId: INSTALLATION_TENANT_ID,
  roles: [INSTANCE_ROLE_ADMIN, INSTANCE_ROLE_MEMBER],
  claims: ['document:*', 'admin:*'],
};

const memberSubject: AuthorizationSubject = {
  kind: 'user',
  id: 'member-1',
  tenantId: INSTALLATION_TENANT_ID,
  roles: [INSTANCE_ROLE_MEMBER],
  claims: ['document:*'],
};

describe('installation authorization', () => {
  it('denies invite without tenant scope', () => {
    expect(
      canPerformInstallationAction({ ...adminSubject, tenantId: '' }, 'installation:invite', {
        assignedRole: INSTANCE_ROLE_MEMBER,
      })
    ).toBe(false);
  });

  it('denies invite for members', () => {
    expect(
      canPerformInstallationAction(memberSubject, 'installation:invite', {
        assignedRole: INSTANCE_ROLE_MEMBER,
      })
    ).toBe(false);
    expect(() => { assertInstallationInviteRoleAllowed(memberSubject, INSTANCE_ROLE_MEMBER); }).toThrow(
      ForbiddenError
    );
  });

  it('allows administrators to invite members', () => {
    expect(() => { assertInstallationInviteRoleAllowed(adminSubject, INSTANCE_ROLE_MEMBER); }
    ).not.toThrow();
  });

  it('allows administrators to invite administrators', () => {
    expect(() => { assertInstallationInviteRoleAllowed(adminSubject, INSTANCE_ROLE_ADMIN); }
    ).not.toThrow();
  });
});
