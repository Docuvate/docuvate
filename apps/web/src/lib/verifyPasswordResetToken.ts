// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { apiBaseUrl } from './api';
import { isRecord } from './apiErrors';

export interface PasswordResetTokenVerification {
  valid: boolean;
}

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
  const body: unknown = await response.json();
  if (isRecord(body) && typeof body.valid === 'boolean') {
    return { valid: body.valid };
  }
  return { valid: false };
}
