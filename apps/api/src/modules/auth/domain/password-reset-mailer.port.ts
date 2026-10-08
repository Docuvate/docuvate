export type PasswordResetMailPayload = {
  readonly to: string;
  readonly subject: string;
  readonly resetUrl: string;
};

/** Sends password-reset messages; must not throw after the auth handler returns (fire-and-forget friendly). */
export interface PasswordResetMailerPort {
  sendPasswordReset(payload: PasswordResetMailPayload): void | Promise<void>;
}
