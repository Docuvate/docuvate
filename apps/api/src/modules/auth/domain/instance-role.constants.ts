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

export function parseBootstrapAdminEmails(envValue: string | undefined): ReadonlySet<string> {
  if (!envValue?.trim()) {
    return new Set();
  }
  return new Set(
    envValue
      .split(',')
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isInstanceAdministratorRole(role: InstanceRole): boolean {
  return role === INSTANCE_ROLE_ADMIN;
}
