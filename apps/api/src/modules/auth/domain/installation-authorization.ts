// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { ForbiddenError } from '../../../shared/domain/errors.js';
import {
  INSTALLATION_DB_ROLE_ADMIN,
  INSTALLATION_DB_ROLE_MEMBER,
  type InstallationDbRole,
} from './installation.constants.js';
import {
  INSTANCE_ROLE_ADMIN,
  INSTANCE_ROLE_MEMBER,
  type InstanceRole,
} from './instance-role.constants.js';
import { subjectIsInstanceAdministrator } from '../../../shared/infrastructure/auth/user-authorization-subject.js';

export type InstallationAuthorizationAction =
  | 'installation:invite'
  | 'installation:change_member_role'
  | 'installation:suspend_member'
  | 'installation:accept_invitation';

export function dbRoleToInstanceRole(role: InstallationDbRole): InstanceRole {
  return role === INSTALLATION_DB_ROLE_ADMIN ? INSTANCE_ROLE_ADMIN : INSTANCE_ROLE_MEMBER;
}

export function instanceRoleToDbRole(role: InstanceRole): InstallationDbRole {
  return role === INSTANCE_ROLE_ADMIN ? INSTALLATION_DB_ROLE_ADMIN : INSTALLATION_DB_ROLE_MEMBER;
}

/** Fail-closed installation IAM checks (subset rule for invite role escalation). */
export function canPerformInstallationAction(
  subject: AuthorizationSubject,
  action: InstallationAuthorizationAction,
  context: { assignedRole?: InstanceRole; inviterDbRole?: InstallationDbRole }
): boolean {
  if (!subject.tenantId) {
    return false;
  }
  if (action === 'installation:accept_invitation') {
    return true;
  }
  if (!subjectIsInstanceAdministrator(subject)) {
    return false;
  }
  if (action === 'installation:suspend_member') {
    return true;
  }
  if (action === 'installation:invite') {
    const target = context.assignedRole ?? INSTANCE_ROLE_MEMBER;
    if (target === INSTANCE_ROLE_ADMIN) {
      return subjectIsInstanceAdministrator(subject);
    }
    return subjectIsInstanceAdministrator(subject);
  }
  if (action === 'installation:change_member_role') {
    const target = context.assignedRole ?? INSTANCE_ROLE_MEMBER;
    if (target === INSTANCE_ROLE_MEMBER) {
      return true;
    }
    return subjectIsInstanceAdministrator(subject);
  }
  return false;
}

export function assertInstallationInviteRoleAllowed(
  subject: AuthorizationSubject,
  assignedRole: InstanceRole
): void {
  if (!canPerformInstallationAction(subject, 'installation:invite', { assignedRole })) {
    throw new ForbiddenError('installation:invite denied');
  }
  if (assignedRole === INSTANCE_ROLE_ADMIN && !subjectIsInstanceAdministrator(subject)) {
    throw new ForbiddenError('installation:invite role escalation denied');
  }
}
