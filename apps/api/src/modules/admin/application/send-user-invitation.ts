// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { InstanceRole } from '../../auth/domain/instance-role.constants.js';
import type { UserInvitationMailerPort } from '../../auth/domain/invite-mailer.port.js';
import {
  resolveInstallationDisplayName,
  resolveInvitationMailLocale,
  resolveInvitationValidityDays,
} from '../../auth/infrastructure/mail/user-invitation-mailer.factory.js';
import {
  buildInvitationAcceptUrl,
  createInvitationToken,
  invitationExpiresAt,
} from '../domain/user-invitation.tokens.js';
import type { UserInvitationRepository } from '../domain/user-invitation.types.js';

export async function deliverUserInvitation(input: {
  invitations: UserInvitationRepository;
  mailer: UserInvitationMailerPort;
  email: string;
  invitedName: string;
  assignedRole: InstanceRole;
  invitedByUserId: string;
}): Promise<{ invitationId: string }> {
  const { token, tokenHash } = createInvitationToken();
  const invitation = await input.invitations.createPending({
    inviteeEmail: input.email,
    inviteeName: input.invitedName,
    assignedRole: input.assignedRole,
    invitedByUserId: input.invitedByUserId,
    tokenHash,
    expiresAt: invitationExpiresAt(),
  });
  await input.mailer.sendInvitation({
    to: input.email,
    invitationId: invitation.id,
    installationName: resolveInstallationDisplayName(),
    invitedName: input.invitedName,
    inviteUrl: buildInvitationAcceptUrl(token),
    locale: resolveInvitationMailLocale(),
    validityDays: resolveInvitationValidityDays(),
  });
  return { invitationId: invitation.id };
}
