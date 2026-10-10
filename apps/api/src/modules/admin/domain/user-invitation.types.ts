// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { InstanceRole } from '../../auth/domain/instance-role.constants.js';

export interface UserInvitationRecord {
  id: string;
  email: string;
  invitedName: string;
  assignedRole: InstanceRole;
  invitedByUserId: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface UserInvitationRepository {
  createPending(input: {
    inviteeEmail: string;
    inviteeName: string;
    assignedRole: InstanceRole;
    invitedByUserId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<UserInvitationRecord>;

  findActiveById(id: string): Promise<UserInvitationRecord | null>;

  findActiveByInviteeEmail(email: string): Promise<UserInvitationRecord | null>;

  findByTokenHash(tokenHash: string): Promise<UserInvitationRecord | null>;

  revokeById(id: string): Promise<void>;

  listPendingWithoutUser(): Promise<UserInvitationRecord[]>;

  purgeExpiredWithoutUser(): Promise<number>;
}

export const USER_INVITATION_REPOSITORY = Symbol('USER_INVITATION_REPOSITORY');
