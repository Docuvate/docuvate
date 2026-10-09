import type { AdminUserDto } from '@docuvate/contracts';
import type { AdminUserListItem } from '../domain/user-administration.port.js';

export function toAdminUserDto(user: AdminUserListItem): AdminUserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    banned: user.banned,
    banReason: user.banReason,
    accountStatus: user.accountStatus,
    createdAt: user.createdAt.toISOString(),
  };
}
