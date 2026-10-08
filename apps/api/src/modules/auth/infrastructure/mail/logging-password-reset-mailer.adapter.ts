import type {
  PasswordResetMailPayload,
  PasswordResetMailerPort,
} from '../../domain/password-reset-mailer.port.js';

export class LoggingPasswordResetMailerAdapter implements PasswordResetMailerPort {
  sendPasswordReset(payload: PasswordResetMailPayload): void {
    // eslint-disable-next-line no-console -- intentional dev-only mail sink
    console.info(
      '[DEV password reset] Do not use in production. Reset link for %s: %s',
      payload.to,
      payload.resetUrl
    );
  }
}
