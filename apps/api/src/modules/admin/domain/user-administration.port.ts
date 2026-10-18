// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { InstanceRole } from '../../auth/domain/instance-role.constants.js';

export type AdminUserAccountStatus = 'active' | 'invited' | 'suspended';

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  role: InstanceRole;
  banned: boolean;
  banReason: string | null;
  accountStatus: AdminUserAccountStatus;
  createdAt: Date;
}

export interface UserAdministrationPort {
  listUsers(input: {
    headers: Headers;
    limit: number;
    offset: number;
    search?: string;
  }): Promise<{ users: AdminUserListItem[]; total: number }>;

  createUser(input: {
    headers: Headers;
    email: string;
    name: string;
    password: string;
    role: InstanceRole;
  }): Promise<AdminUserListItem>;

  setRole(input: { headers: Headers; userId: string; role: InstanceRole }): Promise<void>;

  banUser(input: { headers: Headers; userId: string; reason?: string }): Promise<void>;

  unbanUser(input: { headers: Headers; userId: string }): Promise<void>;

  revokeSessions(input: { headers: Headers; userId: string }): Promise<void>;
}

export const USER_ADMINISTRATION_PORT = Symbol('USER_ADMINISTRATION_PORT');
