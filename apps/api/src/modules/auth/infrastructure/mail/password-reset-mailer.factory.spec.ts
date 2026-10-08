import { describe, expect, it } from 'vitest';
import {
  createPasswordResetMailer,
  resolvePasswordResetMailMode,
} from './password-reset-mailer.factory.js';
import { LoggingPasswordResetMailerAdapter } from './logging-password-reset-mailer.adapter.js';
import { SmtpPasswordResetMailerAdapter } from './smtp-password-reset-mailer.adapter.js';

describe('resolvePasswordResetMailMode', () => {
  it('defaults to auto', () => {
    expect(resolvePasswordResetMailMode({})).toBe('auto');
  });

  it('reads explicit mode', () => {
    expect(resolvePasswordResetMailMode({ PASSWORD_RESET_MAIL_MODE: 'log' })).toBe('log');
  });
});

describe('createPasswordResetMailer', () => {
  it('uses log adapter in non-production without SMTP', () => {
    const mailer = createPasswordResetMailer({ NODE_ENV: 'development' });
    expect(mailer).toBeInstanceOf(LoggingPasswordResetMailerAdapter);
  });

  it('uses SMTP when SMTP_URL is set', () => {
    const mailer = createPasswordResetMailer({
      NODE_ENV: 'development',
      SMTP_URL: 'smtp://localhost:1025',
      MAIL_FROM: 'docuvate@localhost',
    });
    expect(mailer).toBeInstanceOf(SmtpPasswordResetMailerAdapter);
  });

  it('rejects log mode in production', () => {
    expect(() =>
      createPasswordResetMailer({ NODE_ENV: 'production', PASSWORD_RESET_MAIL_MODE: 'log' })
    ).toThrow(/not allowed/);
  });

  it('requires SMTP in production without log override', () => {
    expect(() => createPasswordResetMailer({ NODE_ENV: 'production' })).toThrow(
      /not configured/
    );
  });
});
