// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { PasswordResetMailerPort } from '../../domain/password-reset-mailer.port.js';
import { createPasswordResetMailer } from './password-reset-mailer.factory.js';

export function isEmailChangeMailAvailable(env: NodeJS.ProcessEnv = process.env): boolean {
  const smtpUrl = env.SMTP_URL?.trim();
  const mailFrom = env.MAIL_FROM?.trim();
  if (!smtpUrl || !mailFrom) {
    return false;
  }
  const mode = env.PASSWORD_RESET_MAIL_MODE?.trim().toLowerCase();
  if (mode === 'log') {
    return env.NODE_ENV !== 'production';
  }
  return true;
}

export function createEmailChangeMailer(
  env: NodeJS.ProcessEnv = process.env
): PasswordResetMailerPort {
  return createPasswordResetMailer(env);
}
