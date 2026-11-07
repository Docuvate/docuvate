// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { APIRequestContext } from '@playwright/test';

export function webBaseUrl(): string {
  return process.env.DOCUVATE_WEB_BASE_URL ?? 'http://127.0.0.1:5173';
}

export function auditEmail(): string | undefined {
  const value = process.env.DOCUVATE_AUDIT_EMAIL?.trim();
  return value ? value : undefined;
}

export function auditPassword(): string | undefined {
  const value = process.env.DOCUVATE_AUDIT_PASSWORD;
  return value ? value : undefined;
}

export function syntheticWritesEnabled(): boolean {
  return process.env.DOCUVATE_AUDIT_SYNTHETIC_WRITES === '1';
}

export function syntheticUploadEnabled(): boolean {
  return process.env.DOCUVATE_AUDIT_SYNTHETIC_UPLOAD === '1';
}

export async function targetReachable(request: APIRequestContext): Promise<boolean> {
  try {
    const response = await request.get('/login', { timeout: 5_000 });
    return response.status() < 500;
  } catch {
    return false;
  }
}
