// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export type PasswordResetMailPayload = {
  readonly to: string;
  readonly subject: string;
  readonly resetUrl: string;
};

/** Sends password-reset messages; must not throw after the auth handler returns (fire-and-forget friendly). */
export interface PasswordResetMailerPort {
  sendPasswordReset(payload: PasswordResetMailPayload): void | Promise<void>;
}
