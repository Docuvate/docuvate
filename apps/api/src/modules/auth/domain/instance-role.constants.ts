// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/** Stored on better-auth `user.role`. */
export const INSTANCE_ROLE_ADMIN = 'admin' as const;
export const INSTANCE_ROLE_MEMBER = 'member' as const;

export type InstanceRole = typeof INSTANCE_ROLE_ADMIN | typeof INSTANCE_ROLE_MEMBER;

export function normalizeInstanceRole(raw: string | null | undefined): InstanceRole {
  if (raw === INSTANCE_ROLE_ADMIN) {
    return INSTANCE_ROLE_ADMIN;
  }
  return INSTANCE_ROLE_MEMBER;
}
