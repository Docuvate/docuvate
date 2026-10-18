// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { PasswordPolicyDto, PasswordPolicyRuleId } from '@docuvate/contracts';
import { ERROR_CODES, passwordPolicyViolations } from '@docuvate/contracts';
import { APIError } from 'better-auth';
import { isPasswordCompromised } from 'better-auth/plugins/haveibeenpwned';

import { ValidationError } from '../../../shared/domain/errors.js';

export class PasswordPolicyViolationError extends ValidationError {
  constructor(public readonly violations: PasswordPolicyRuleId[]) {
    super('auth.passwordPolicyViolation', ERROR_CODES.AUTH_PASSWORD_POLICY_VIOLATION);
  }
}

export async function enforcePasswordPolicy(
  policy: PasswordPolicyDto,
  password: string
): Promise<void> {
  let breached = false;
  if (policy.checkBreached && password.length > 0) {
    breached = await isPasswordCompromised(password);
  }
  const violations = passwordPolicyViolations(policy, password, { breached });
  if (violations.length === 0) {
    return;
  }
  throw new PasswordPolicyViolationError(violations);
}

export async function enforcePasswordPolicyForBetterAuth(
  policy: PasswordPolicyDto,
  password: string
): Promise<void> {
  try {
    await enforcePasswordPolicy(policy, password);
  } catch (err) {
    if (err instanceof PasswordPolicyViolationError) {
      const authError = APIError.from('BAD_REQUEST', {
        message: 'Password does not meet the instance policy',
        code: ERROR_CODES.AUTH_PASSWORD_POLICY_VIOLATION,
      });
      if (authError instanceof Error) {
        throw authError;
      }
      throw new Error('Password does not meet the instance policy');
    }
    throw err;
  }
}
