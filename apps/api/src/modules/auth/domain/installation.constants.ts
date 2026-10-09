/** Single implicit installation tenant id for ABAC scope. */
export const INSTALLATION_TENANT_ID = '00000000-0000-4000-8000-000000000001';

export const INSTALLATION_DB_ROLE_ADMIN = 'installation_admin' as const;
export const INSTALLATION_DB_ROLE_MEMBER = 'installation_member' as const;

export type InstallationDbRole =
  | typeof INSTALLATION_DB_ROLE_ADMIN
  | typeof INSTALLATION_DB_ROLE_MEMBER;
