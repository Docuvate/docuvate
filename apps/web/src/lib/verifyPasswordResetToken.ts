// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { apiBaseUrl } from './api';

export type PasswordResetTokenVerification = {
  valid: boolean;
};

function passwordResetVerifyBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin.replace(/\/$/, '')}/api/v1`;
  }
  return apiBaseUrl();
}

export async function verifyPasswordResetToken(
  token: string
): Promise<PasswordResetTokenVerification> {
  const params = new URLSearchParams({ token });
  const response = await fetch(
    `${passwordResetVerifyBaseUrl()}/auth/password-reset/verify?${params.toString()}`,
    {
      credentials: 'include',
    }
  );
  if (!response.ok) {
    return { valid: false };
  }
  const body = (await response.json()) as PasswordResetTokenVerification;
  return { valid: body.valid === true };
}
