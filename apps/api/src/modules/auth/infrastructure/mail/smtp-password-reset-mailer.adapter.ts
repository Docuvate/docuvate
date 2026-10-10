// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import nodemailer from 'nodemailer';

import type {
  PasswordResetMailerPort,
  PasswordResetMailPayload,
} from '../../domain/password-reset-mailer.port.js';

export interface SmtpPasswordResetMailerOptions {
  smtpUrl: string;
  mailFrom: string;
}

export class SmtpPasswordResetMailerAdapter implements PasswordResetMailerPort {
  private readonly transport;

  constructor(private readonly options: SmtpPasswordResetMailerOptions) {
    this.transport = nodemailer.createTransport(options.smtpUrl);
  }

  async sendPasswordReset(payload: PasswordResetMailPayload): Promise<void> {
    await this.transport.sendMail({
      from: this.options.mailFrom,
      to: payload.to,
      subject: payload.subject,
      text: `Reset your Docuvate password:\n\n${payload.resetUrl}\n`,
    });
  }
}
