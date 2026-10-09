// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { AuthorizationSubject } from '../../domain/authorization.js';
import { INSTALLATION_TENANT_ID } from '../../../modules/auth/domain/installation.constants.js';
import {
  INSTANCE_ROLE_ADMIN,
  INSTANCE_ROLE_MEMBER,
  type InstanceRole,
} from '../../../modules/auth/domain/instance-role.constants.js';

export type SessionUserWithRole = {
  id: string;
  installationRole: InstanceRole;
};

export function buildUserAuthorizationSubject(user: SessionUserWithRole): AuthorizationSubject {
  const isAdmin = user.installationRole === INSTANCE_ROLE_ADMIN;
  return {
    kind: 'user',
    id: user.id,
    tenantId: INSTALLATION_TENANT_ID,
    roles: isAdmin ? [INSTANCE_ROLE_ADMIN, INSTANCE_ROLE_MEMBER] : [INSTANCE_ROLE_MEMBER],
    claims: isAdmin ? ['document:*', 'admin:*'] : ['document:*'],
  };
}

export function subjectIsInstanceAdministrator(subject: AuthorizationSubject): boolean {
  return subject.kind === 'user' && subject.roles.includes(INSTANCE_ROLE_ADMIN);
}

export function isInstanceAdmin(subject: AuthorizationSubject): boolean {
  return subjectIsInstanceAdministrator(subject);
}
