// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { auth } from '../shared/infrastructure/auth/better-auth.config.js';
import {
  AdminResetPasswordUseCase,
  type AdminResetPasswordAuthContext,
} from '../modules/auth/application/admin-reset-password.use-case.js';
import { parseAuthResetPasswordArgs } from './auth-reset-password.args.js';
import { readHiddenPassword } from './read-hidden-password.js';

async function main(): Promise<void> {
  const { email, revokeSessions } = parseAuthResetPasswordArgs(process.argv.slice(2));
  const password = await readHiddenPassword('New password: ');
  const confirm = await readHiddenPassword('Confirm password: ');

  if (!password || password !== confirm) {
    throw new Error('Passwords do not match');
  }

  const useCase = new AdminResetPasswordUseCase(
    () => auth.$context as Promise<AdminResetPasswordAuthContext>
  );
  await useCase.execute({ email, newPassword: password, revokeSessions });
  process.stderr.write(`Password updated for ${email}\n`);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`auth:reset-password failed: ${message}\n`);
  process.exit(1);
});
