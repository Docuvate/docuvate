// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { PasswordResetMailerPort } from '../../domain/password-reset-mailer.port.js';
import { LoggingPasswordResetMailerAdapter } from './logging-password-reset-mailer.adapter.js';
import { SmtpPasswordResetMailerAdapter } from './smtp-password-reset-mailer.adapter.js';

export type PasswordResetMailMode = 'auto' | 'log' | 'smtp';

export function resolvePasswordResetMailMode(
  env: NodeJS.ProcessEnv = process.env
): PasswordResetMailMode {
  const raw = env['PASSWORD_RESET_MAIL_MODE']?.trim().toLowerCase();
  if (raw === 'log' || raw === 'smtp' || raw === 'auto') {
    return raw;
  }
  return 'auto';
}

export function createPasswordResetMailer(
  env: NodeJS.ProcessEnv = process.env
): PasswordResetMailerPort {
  const mode = resolvePasswordResetMailMode(env);
  const smtpUrl = env['SMTP_URL']?.trim();
  const mailFrom = env['MAIL_FROM']?.trim();
  const isProduction = env['NODE_ENV'] === 'production';

  if (mode === 'log') {
    if (isProduction) {
      throw new Error('PASSWORD_RESET_MAIL_MODE=log is not allowed when NODE_ENV=production');
    }
    return new LoggingPasswordResetMailerAdapter();
  }

  if (mode === 'smtp' || (mode === 'auto' && smtpUrl)) {
    if (!smtpUrl || !mailFrom) {
      throw new Error('SMTP_URL and MAIL_FROM are required for SMTP password-reset mail');
    }
    return new SmtpPasswordResetMailerAdapter({ smtpUrl, mailFrom });
  }

  if (isProduction) {
    throw new Error(
      'Password reset mail is not configured: set SMTP_URL and MAIL_FROM, or use Mailpit in dev only'
    );
  }

  return new LoggingPasswordResetMailerAdapter();
}
