// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import nodemailer from 'nodemailer';
import type {
  UserInvitationMailPayload,
  UserInvitationMailerPort,
} from '../../domain/invite-mailer.port.js';
import {
  userInvitationMailHtml,
  userInvitationMailSubject,
  userInvitationMailText,
} from './user-invitation-mail.templates.js';

export type SmtpUserInvitationMailerOptions = {
  smtpUrl: string;
  mailFrom: string;
};

export class SmtpUserInvitationMailerAdapter implements UserInvitationMailerPort {
  private readonly transport;

  constructor(private readonly options: SmtpUserInvitationMailerOptions) {
    this.transport = nodemailer.createTransport(options.smtpUrl);
  }

  async sendInvitation(payload: UserInvitationMailPayload): Promise<void> {
    await this.transport.sendMail({
      from: this.options.mailFrom,
      to: payload.to,
      subject: userInvitationMailSubject(payload.installationName, payload.locale),
      text: userInvitationMailText(payload),
      html: userInvitationMailHtml(payload),
    });
  }
}
