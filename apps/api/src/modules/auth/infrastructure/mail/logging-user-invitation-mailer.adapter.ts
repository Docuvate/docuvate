// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  UserInvitationMailPayload,
  UserInvitationMailerPort,
} from '../../domain/invite-mailer.port.js';
import { userInvitationMailSubject } from './user-invitation-mail.templates.js';

export class LoggingUserInvitationMailerAdapter implements UserInvitationMailerPort {
  async sendInvitation(payload: UserInvitationMailPayload): Promise<void> {
    const subject = userInvitationMailSubject(payload.installationName, payload.locale);
    process.stderr.write(
      `[invite-mail] to=${payload.to} invitationId=${payload.invitationId} subject=${JSON.stringify(subject)}\n`
    );
  }
}
