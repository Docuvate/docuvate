import type { InstanceRole } from './instance-role.constants.js';

/** Installation membership resolved from Docuvate IAM tables. */
export type InstanceMembership = {
  userId: string;
  tenantId: string;
  role: InstanceRole;
};
