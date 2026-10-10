// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  PasswordResetMailerPort,
  PasswordResetMailPayload,
} from '../../domain/password-reset-mailer.port.js';

export class LoggingPasswordResetMailerAdapter implements PasswordResetMailerPort {
  sendPasswordReset(payload: PasswordResetMailPayload): void {
     
    console.info(
      '[DEV password reset] Do not use in production. Reset link for %s: %s',
      payload.to,
      payload.resetUrl
    );
  }
}
