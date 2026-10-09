// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** Nest admin API owns IAM; better-auth /api/auth/admin/* must not be reachable over HTTP. */
export function isBetterAuthAdminPluginPath(pathname: string): boolean {
  return pathname === '/api/auth/admin' || pathname.startsWith('/api/auth/admin/');
}
