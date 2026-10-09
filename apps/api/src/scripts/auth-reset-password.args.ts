// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export type AuthResetPasswordCliArgs = {
  email: string;
  revokeSessions: boolean;
};

export function parseAuthResetPasswordArgs(argv: string[]): AuthResetPasswordCliArgs {
  const positional: string[] = [];
  let revokeSessions = false;

  for (const arg of argv) {
    if (arg === '--revoke-sessions') {
      revokeSessions = true;
      continue;
    }
    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    }
    positional.push(arg);
  }

  const email = positional[0]?.trim();
  if (!email) {
    throw new Error('Usage: auth:reset-password <email> [--revoke-sessions]');
  }
  if (positional.length > 1) {
    throw new Error('Unexpected extra arguments');
  }

  return { email, revokeSessions };
}
