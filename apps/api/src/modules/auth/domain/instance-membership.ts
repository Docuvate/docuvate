// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { InstanceRole } from './instance-role.constants.js';

/** Installation membership resolved from Docuvate IAM tables. */
export type InstanceMembership = {
  userId: string;
  tenantId: string;
  role: InstanceRole;
};
