// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  AdminAccessResponse,
  AdminUserDto,
  AdminUserListResponse,
  BanAdminUserRequest,
  InstanceRole,
  InviteAdminUserRequest,
  SetAdminUserRoleRequest,
} from '@docuvate/contracts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

import { CursorListQueryDto } from './cursor-list-query.dto.js';

export class AdminAccessResponseDto implements AdminAccessResponse {
  @ApiProperty()
  isAdministrator!: boolean;

  @ApiProperty({ enum: ['admin', 'member'] })
  role!: InstanceRole;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  roleDescriptions!: AdminAccessResponse['roleDescriptions'];
}

export class AdminUserResponseDto implements AdminUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: ['admin', 'member'] })
  role!: InstanceRole;

  @ApiProperty()
  banned!: boolean;

  @ApiPropertyOptional({ nullable: true })
  banReason!: string | null;

  @ApiProperty({ enum: ['active', 'invited', 'suspended'] })
  accountStatus!: AdminUserDto['accountStatus'];

  @ApiProperty()
  createdAt!: string;

  @ApiPropertyOptional({ nullable: true })
  lastLoginAt!: string | null;
}

export class AdminUserListResponseDto implements AdminUserListResponse {
  @ApiProperty({ type: [AdminUserResponseDto] })
  users!: AdminUserDto[];

  @ApiProperty({ nullable: true })
  nextCursor!: string | null;

  @ApiProperty()
  hasMore!: boolean;

  @ApiProperty({ nullable: true })
  total!: number | null;
}

export class ListAdminUsersQueryDto extends CursorListQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}

export class InviteAdminUserRequestDto implements InviteAdminUserRequest {
  @IsEmail()
  email!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsIn(['admin', 'member'])
  role?: InstanceRole;
}

export class AdminUserIdParamDto {
  @IsString()
  userId!: string;
}

export class SetAdminUserRoleRequestDto implements SetAdminUserRoleRequest {
  @IsIn(['admin', 'member'])
  role!: InstanceRole;
}

export class BanAdminUserRequestDto implements BanAdminUserRequest {
  @IsOptional()
  @IsString()
  reason?: string;
}
