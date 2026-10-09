// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { UserInvitationMailerPort } from '../../domain/invite-mailer.port.js';
import { resolvePasswordResetMailMode } from './password-reset-mailer.factory.js';
import { LoggingUserInvitationMailerAdapter } from './logging-user-invitation-mailer.adapter.js';
import { SmtpUserInvitationMailerAdapter } from './smtp-user-invitation-mailer.adapter.js';

export function createUserInvitationMailer(
  env: NodeJS.ProcessEnv = process.env
): UserInvitationMailerPort {
  const mode = resolvePasswordResetMailMode(env);
  const smtpUrl = env['SMTP_URL']?.trim();
  const mailFrom = env['MAIL_FROM']?.trim();
  const isProduction = env['NODE_ENV'] === 'production';

  if (mode === 'log') {
    if (isProduction) {
      throw new Error('PASSWORD_RESET_MAIL_MODE=log is not allowed when NODE_ENV=production');
    }
    return new LoggingUserInvitationMailerAdapter();
  }

  if (mode === 'smtp' || (mode === 'auto' && smtpUrl)) {
    if (!smtpUrl || !mailFrom) {
      throw new Error('SMTP_URL and MAIL_FROM are required for invitation mail');
    }
    return new SmtpUserInvitationMailerAdapter({ smtpUrl, mailFrom });
  }

  if (isProduction) {
    throw new Error('Invitation mail is not configured: set SMTP_URL and MAIL_FROM');
  }

  return new LoggingUserInvitationMailerAdapter();
}

export function resolveInstallationDisplayName(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env['DOCUVATE_INSTALLATION_NAME']?.trim();
  return configured && configured.length > 0 ? configured : 'Docuvate';
}

export function resolveInvitationMailLocale(env: NodeJS.ProcessEnv = process.env): 'de' | 'en' {
  const raw = env['DOCUVATE_INSTALLATION_LOCALE']?.trim().toLowerCase();
  return raw === 'en' ? 'en' : 'de';
}

export function resolveInvitationValidityDays(env: NodeJS.ProcessEnv = process.env): number {
  const hours = Number(env['DOCUVATE_INVITE_TTL_HOURS'] ?? 168);
  const ttlHours = Number.isFinite(hours) && hours > 0 ? hours : 168;
  return Math.max(1, Math.round(ttlHours / 24));
}
