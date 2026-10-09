import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';
import { ForbiddenError, ValidationError } from '../../../shared/domain/errors.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { subjectIsInstanceAdministrator } from '../../../shared/infrastructure/auth/user-authorization-subject.js';
import {
  INSTANCE_ROLE_ADMIN,
  INSTANCE_ROLE_MEMBER,
  normalizeInstanceRole,
  type InstanceRole,
} from '../../auth/domain/instance-role.constants.js';
import { assertRoleChangeAllowed } from '../domain/last-admin.policy.js';
import {
  USER_ADMINISTRATION_PORT,
  type AdminUserListItem,
  type UserAdministrationPort,
} from '../domain/user-administration.port.js';
import {
  USER_INVITATION_REPOSITORY,
  type UserInvitationRepository,
} from '../domain/user-invitation.types.js';
import type { UserInvitationMailerPort } from '../../auth/domain/invite-mailer.port.js';
import { createUserInvitationMailer } from '../../auth/infrastructure/mail/user-invitation-mailer.factory.js';
import { deliverUserInvitation } from './send-user-invitation.js';
import { assertInstallationInviteRoleAllowed } from '../../auth/domain/installation-authorization.js';

export type AdminAccessDto = {
  isAdministrator: boolean;
  role: InstanceRole;
  roleDescriptions: Array<{ role: InstanceRole; summaryKey: string }>;
};

@Injectable()
export class GetAdminAccessUseCase {
  execute(subject: AuthorizationSubject): AdminAccessDto {
    const role = subject.roles.includes(INSTANCE_ROLE_ADMIN)
      ? INSTANCE_ROLE_ADMIN
      : INSTANCE_ROLE_MEMBER;
    return {
      isAdministrator: subjectIsInstanceAdministrator(subject),
      role,
      roleDescriptions: [
        { role: INSTANCE_ROLE_ADMIN, summaryKey: 'admin.roles.adminSummary' },
        { role: INSTANCE_ROLE_MEMBER, summaryKey: 'admin.roles.memberSummary' },
      ],
    };
  }
}

@Injectable()
export class ListAdminUsersUseCase {
  constructor(@Inject(USER_ADMINISTRATION_PORT) private readonly users: UserAdministrationPort) {}

  async execute(input: {
    headers: Headers;
    limit: number;
    offset: number;
    search?: string;
  }) {
    return await this.users.listUsers(input);
  }
}

function invitationToListItem(invite: {
  id: string;
  email: string;
  invitedName: string;
  assignedRole: InstanceRole;
  createdAt: Date;
}): AdminUserListItem {
  return {
    id: invite.id,
    name: invite.invitedName,
    email: invite.email,
    role: invite.assignedRole,
    banned: false,
    banReason: null,
    accountStatus: 'invited',
    createdAt: invite.createdAt,
  };
}

@Injectable()
export class InviteAdminUserUseCase {
  private readonly mailer: UserInvitationMailerPort = createUserInvitationMailer();

  constructor(
    @Inject(USER_INVITATION_REPOSITORY) private readonly invitations: UserInvitationRepository,
    @Inject(PG_POOL) private readonly pool: pg.Pool
  ) {}

  async execute(input: {
    actorSubject: AuthorizationSubject;
    actorUserId: string;
    headers: Headers;
    email: string;
    name: string;
    role: InstanceRole;
  }) {
    assertRoleChangeAllowed(input.role);
    assertInstallationInviteRoleAllowed(input.actorSubject, input.role);
    const email = input.email.trim().toLowerCase();
    if (!email.includes('@')) {
      throw new ValidationError('admin.errors.invalidEmail');
    }
    await assertEmailAvailableForInvitation(this.pool, this.invitations, email);
    const invitedName = input.name.trim() || email;
    const { invitationId } = await deliverUserInvitation({
      invitations: this.invitations,
      mailer: this.mailer,
      email,
      invitedName,
      assignedRole: input.role,
      invitedByUserId: input.actorUserId,
    });
    const invite = await this.invitations.findActiveById(invitationId);
    if (!invite) {
      throw new Error('Invitation missing after create');
    }
    return invitationToListItem(invite);
  }
}

@Injectable()
export class ResendAdminUserInvitationUseCase {
  private readonly mailer: UserInvitationMailerPort = createUserInvitationMailer();

  constructor(
    @Inject(USER_INVITATION_REPOSITORY) private readonly invitations: UserInvitationRepository,
    @Inject(PG_POOL) private readonly pool: pg.Pool
  ) {}

  async execute(input: { actorUserId: string; userId: string }) {
    const pending = await resolvePendingInvitation(this.invitations, input.userId);
    await deliverUserInvitation({
      invitations: this.invitations,
      mailer: this.mailer,
      email: pending.email,
      invitedName: pending.invitedName,
      assignedRole: pending.assignedRole,
      invitedByUserId: input.actorUserId,
    });
  }
}

@Injectable()
export class RevokeAdminUserInvitationUseCase {
  constructor(
    @Inject(USER_INVITATION_REPOSITORY) private readonly invitations: UserInvitationRepository
  ) {}

  async execute(input: { actorUserId: string; invitationId: string }) {
    const pending = await resolvePendingInvitation(this.invitations, input.invitationId);
    await this.invitations.revokeById(pending.id);
  }
}

@Injectable()
export class SetAdminUserRoleUseCase {
  constructor(
    @Inject(USER_ADMINISTRATION_PORT) private readonly users: UserAdministrationPort,
    @Inject(PG_POOL) private readonly pool: pg.Pool
  ) {}

  async execute(input: {
    actorUserId: string;
    headers: Headers;
    userId: string;
    role: InstanceRole;
  }) {
    assertRoleChangeAllowed(input.role);
    const nextRole = normalizeInstanceRole(input.role);
    const currentRow = await this.pool.query<{ role: string }>(
      `SELECT role FROM installation_user_roles WHERE user_id = $1`,
      [input.userId]
    );
    const previousRole =
      currentRow.rows[0]?.role === 'installation_admin'
        ? INSTANCE_ROLE_ADMIN
        : INSTANCE_ROLE_MEMBER;

    if (input.actorUserId === input.userId && nextRole !== previousRole) {
      throw new ForbiddenError('admin.errors.cannotChangeOwnRole');
    }

    await this.users.setRole({
      headers: input.headers,
      userId: input.userId,
      role: nextRole,
    });
  }
}

@Injectable()
export class BanAdminUserUseCase {
  constructor(@Inject(USER_ADMINISTRATION_PORT) private readonly users: UserAdministrationPort) {}

  async execute(input: {
    actorUserId: string;
    headers: Headers;
    userId: string;
    reason?: string;
  }) {
    if (input.actorUserId === input.userId) {
      throw new ForbiddenError('admin.errors.cannotBanSelf');
    }
    await this.users.banUser({
      headers: input.headers,
      userId: input.userId,
      reason: input.reason,
    });
  }
}

@Injectable()
export class UnbanAdminUserUseCase {
  constructor(@Inject(USER_ADMINISTRATION_PORT) private readonly users: UserAdministrationPort) {}

  async execute(input: { actorUserId: string; headers: Headers; userId: string }) {
    await this.users.unbanUser({ headers: input.headers, userId: input.userId });
  }
}

@Injectable()
export class RevokeAdminUserSessionsUseCase {
  constructor(@Inject(USER_ADMINISTRATION_PORT) private readonly users: UserAdministrationPort) {}

  async execute(input: { actorUserId: string; headers: Headers; userId: string }) {
    await this.users.revokeSessions({ headers: input.headers, userId: input.userId });
  }
}

async function assertEmailAvailableForInvitation(
  pool: pg.Pool,
  invitations: UserInvitationRepository,
  email: string
): Promise<void> {
  const existingUser = await pool.query<{ id: string }>(
    `SELECT id FROM "user" WHERE lower(email) = $1 LIMIT 1`,
    [email]
  );
  if (existingUser.rows[0]) {
    throw new ValidationError('admin.errors.emailAlreadyRegistered');
  }
  const pending = await invitations.findActiveByInviteeEmail(email);
  if (pending) {
    throw new ValidationError('admin.errors.invitationAlreadyPending');
  }
}

async function resolvePendingInvitation(
  invitations: UserInvitationRepository,
  invitationId: string
) {
  const byId = await invitations.findActiveById(invitationId);
  if (byId) {
    return byId;
  }
  throw new ValidationError('admin.errors.noPendingInvitation');
}
