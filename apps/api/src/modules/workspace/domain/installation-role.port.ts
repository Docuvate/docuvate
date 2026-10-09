// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** Reads installation admin membership (ADR 019 / PR #20 `installation_user_roles`). */
export interface InstallationRoleReader {
  isInstallationAdmin(userId: string): Promise<boolean>;
}

export const INSTALLATION_ROLE_READER = Symbol('INSTALLATION_ROLE_READER');
