// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { FastifyRequest } from 'fastify';

import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import { AdminGuard } from '../../../shared/infrastructure/auth/admin.guard.js';
import {
  AuthGuard,
  type AuthSession,
  AuthSubject,
  Session,
} from '../../../shared/infrastructure/auth/auth.guard.js';
import {
  AdminAccessResponseDto,
  AdminUserIdParamDto,
  AdminUserListResponseDto,
  BanAdminUserRequestDto,
  InviteAdminUserRequestDto,
  ListAdminUsersQueryDto,
  SetAdminUserRoleRequestDto,
} from '../../../shared/presentation/dtos/admin.dto.js';
import { SetAdminUserFeatureFlagRequestDto } from '../../../shared/presentation/dtos/admin-feature-flag.dto.js';
import {
  AdminAuthSignInSettingsResponseDto,
  AdminOidcProviderIdParamDto,
  AdminOidcProviderResponseDto,
  CreateAdminOidcProviderRequestDto,
  UpdateAdminOidcProviderRequestDto,
} from '../../../shared/presentation/dtos/auth-sign-in.dto.js';
import { parseCursorListQuery } from '../../../shared/presentation/dtos/cursor-list-query.dto.js';
import {
  PasswordPolicyResponseDto,
  UpdatePasswordPolicyRequestDto,
} from '../../../shared/presentation/dtos/password-policy.dto.js';
import { FeatureFlagsResponseDto } from '../../../shared/presentation/dtos/remote-config.dto.js';
import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';
import {
  CreateAdminOidcProviderUseCase,
  DeleteAdminOidcProviderUseCase,
  UpdateAdminOidcProviderUseCase,
} from '../../auth/application/admin-oidc-provider.use-cases.js';
import { GetAdminAuthSignInSettingsUseCase } from '../../auth/application/get-admin-auth-sign-in-settings.use-case.js';
import { GetPasswordPolicyUseCase } from '../../auth/application/get-password-policy.use-case.js';
import { UpdatePasswordPolicyUseCase } from '../../auth/application/update-password-policy.use-case.js';
import { INSTANCE_ROLE_MEMBER } from '../../auth/domain/instance-role.constants.js';
import { SetTenantFeatureFlagOverrideUseCase } from '../../feature-flags/application/set-tenant-feature-flag-override.use-case.js';
import {
  BanAdminUserUseCase,
  GetAdminAccessUseCase,
  InviteAdminUserUseCase,
  ListAdminUsersUseCase,
  ResendAdminUserInvitationUseCase,
  RevokeAdminUserInvitationUseCase,
  RevokeAdminUserSessionsUseCase,
  SetAdminUserRoleUseCase,
  UnbanAdminUserUseCase,
} from '../application/admin.use-cases.js';
import { toAdminUserDto } from './admin.mapper.js';

function requestHeaders(req: FastifyRequest): Headers {
  return fromNodeHeaders(req.headers);
}

@ApiDocuvateController('admin')
@Controller('admin')
@UseGuards(AuthGuard)
export class AdminController {
  constructor(
    private readonly access: GetAdminAccessUseCase,
    private readonly listUsers: ListAdminUsersUseCase,
    private readonly inviteUser: InviteAdminUserUseCase,
    private readonly setRole: SetAdminUserRoleUseCase,
    private readonly banUser: BanAdminUserUseCase,
    private readonly unbanUser: UnbanAdminUserUseCase,
    private readonly revokeSessions: RevokeAdminUserSessionsUseCase,
    private readonly resendInvitation: ResendAdminUserInvitationUseCase,
    private readonly revokeInvitation: RevokeAdminUserInvitationUseCase,
    private readonly setFeatureFlagOverride: SetTenantFeatureFlagOverrideUseCase,
    private readonly getPasswordPolicy: GetPasswordPolicyUseCase,
    private readonly updatePasswordPolicy: UpdatePasswordPolicyUseCase,
    private readonly getAuthSignInSettings: GetAdminAuthSignInSettingsUseCase,
    private readonly createOidcProvider: CreateAdminOidcProviderUseCase,
    private readonly updateOidcProvider: UpdateAdminOidcProviderUseCase,
    private readonly deleteOidcProvider: DeleteAdminOidcProviderUseCase
  ) {}

  @Get('access')
  @ApiDocuvateRoute({ operationId: 'getAdminAccess', summary: 'Viewer administration access' })
  getAccess(@AuthSubject() subject: AuthorizationSubject): AdminAccessResponseDto {
    return this.access.execute(subject);
  }

  @Get('password-policy')
  @UseGuards(AdminGuard)
  @ApiDocuvateRoute({
    operationId: 'getAdminPasswordPolicy',
    summary: 'Read instance password policy (admin)',
  })
  async getAdminPasswordPolicy(): Promise<PasswordPolicyResponseDto> {
    return this.getPasswordPolicy.execute();
  }

  @Put('password-policy')
  @UseGuards(AdminGuard)
  @ApiDocuvateRoute({
    operationId: 'updateAdminPasswordPolicy',
    summary: 'Update instance password policy (admin)',
  })
  async updateAdminPasswordPolicy(
    @Body() body: UpdatePasswordPolicyRequestDto
  ): Promise<PasswordPolicyResponseDto> {
    return this.updatePasswordPolicy.execute(body);
  }

  @Get('auth-sign-in')
  @UseGuards(AdminGuard)
  @ApiDocuvateRoute({
    operationId: 'getAdminAuthSignInSettings',
    summary: 'Read passkey and OIDC sign-in settings (admin)',
  })
  async getAdminAuthSignInSettings(): Promise<AdminAuthSignInSettingsResponseDto> {
    return this.getAuthSignInSettings.execute();
  }

  @Post('oidc-providers')
  @UseGuards(AdminGuard)
  @ApiDocuvateRoute({
    operationId: 'createAdminOidcProvider',
    summary: 'Create an OIDC SSO provider (admin-managed)',
  })
  async createAdminOidcProvider(
    @Body() body: CreateAdminOidcProviderRequestDto
  ): Promise<AdminOidcProviderResponseDto> {
    return this.createOidcProvider.execute(body);
  }

  @Put('oidc-providers/:id')
  @UseGuards(AdminGuard)
  @ApiDocuvateRoute({
    operationId: 'updateAdminOidcProvider',
    summary: 'Update an admin-managed OIDC provider',
  })
  async updateAdminOidcProvider(
    @Param() params: AdminOidcProviderIdParamDto,
    @Body() body: UpdateAdminOidcProviderRequestDto
  ): Promise<AdminOidcProviderResponseDto> {
    return this.updateOidcProvider.execute(params.id, body);
  }

  @Delete('oidc-providers/:id')
  @UseGuards(AdminGuard)
  @ApiDocuvateRoute({
    operationId: 'deleteAdminOidcProvider',
    summary: 'Delete an admin-managed OIDC provider',
  })
  async deleteAdminOidcProvider(@Param() params: AdminOidcProviderIdParamDto): Promise<{ ok: true }> {
    await this.deleteOidcProvider.execute(params.id);
    return { ok: true };
  }

  @Get('users')
  @UseGuards(AdminGuard)
  @ApiDocuvateRoute({ operationId: 'listAdminUsers', summary: 'List instance users' })
  async listAdminUsers(
    @Query() query: ListAdminUsersQueryDto,
    @Req() req: FastifyRequest
  ): Promise<AdminUserListResponseDto> {
    const pagination = parseCursorListQuery(query);
    const result = await this.listUsers.execute({
      headers: requestHeaders(req),
      limit: pagination.limit,
      cursor: pagination.cursor,
      search: query.search,
    });
    return {
      users: result.users.map(toAdminUserDto),
      total: result.total,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
    };
  }

  @Post('users')
  @UseGuards(AdminGuard)
  @ApiDocuvateRoute({ operationId: 'inviteAdminUser', summary: 'Invite a user' })
  async inviteAdminUser(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Body() body: InviteAdminUserRequestDto,
    @Req() req: FastifyRequest
  ): Promise<AdminUserListResponseDto['users'][number]> {
    const user = await this.inviteUser.execute({
      actorSubject: subject,
      actorUserId: session.user.id,
      headers: requestHeaders(req),
      email: body.email,
      name: body.name,
      role: body.role ?? INSTANCE_ROLE_MEMBER,
    });
    return toAdminUserDto(user);
  }

  @Patch('users/:userId/role')
  @UseGuards(AdminGuard)
  @ApiDocuvateRoute({ operationId: 'setAdminUserRole', summary: 'Change a user role' })
  async setAdminUserRole(
    @Session() session: AuthSession,
    @Param() params: AdminUserIdParamDto,
    @Body() body: SetAdminUserRoleRequestDto,
    @Req() req: FastifyRequest
  ): Promise<{ ok: true }> {
    await this.setRole.execute({
      actorUserId: session.user.id,
      headers: requestHeaders(req),
      userId: params.userId,
      role: body.role,
    });
    return { ok: true };
  }

  @Post('users/:userId/ban')
  @UseGuards(AdminGuard)
  @ApiDocuvateRoute({ operationId: 'banAdminUser', summary: 'Ban a user' })
  async banAdminUser(
    @Session() session: AuthSession,
    @Param() params: AdminUserIdParamDto,
    @Body() body: BanAdminUserRequestDto,
    @Req() req: FastifyRequest
  ): Promise<{ ok: true }> {
    await this.banUser.execute({
      actorUserId: session.user.id,
      headers: requestHeaders(req),
      userId: params.userId,
      reason: body.reason,
    });
    return { ok: true };
  }

  @Post('users/:userId/unban')
  @UseGuards(AdminGuard)
  @ApiDocuvateRoute({ operationId: 'unbanAdminUser', summary: 'Unban a user' })
  async unbanAdminUser(
    @Session() session: AuthSession,
    @Param() params: AdminUserIdParamDto,
    @Req() req: FastifyRequest
  ): Promise<{ ok: true }> {
    await this.unbanUser.execute({
      actorUserId: session.user.id,
      headers: requestHeaders(req),
      userId: params.userId,
    });
    return { ok: true };
  }

  @Post('users/:userId/resend-invitation')
  @UseGuards(AdminGuard)
  @ApiDocuvateRoute({ operationId: 'resendAdminUserInvitation', summary: 'Resend user invitation' })
  async resendAdminUserInvitation(
    @Session() session: AuthSession,
    @Param() params: AdminUserIdParamDto
  ): Promise<{ ok: true }> {
    await this.resendInvitation.execute({
      actorUserId: session.user.id,
      userId: params.userId,
    });
    return { ok: true };
  }

  @Post('users/:userId/revoke-invitation')
  @UseGuards(AdminGuard)
  @ApiDocuvateRoute({
    operationId: 'revokeAdminUserInvitation',
    summary: 'Revoke pending invitation',
  })
  async revokeAdminUserInvitation(
    @Session() session: AuthSession,
    @Param() params: AdminUserIdParamDto
  ): Promise<{ ok: true }> {
    await this.revokeInvitation.execute({
      actorUserId: session.user.id,
      invitationId: params.userId,
    });
    return { ok: true };
  }

  @Post('users/:userId/revoke-sessions')
  @UseGuards(AdminGuard)
  @ApiDocuvateRoute({
    operationId: 'revokeAdminUserSessions',
    summary: 'Revoke all sessions for a user',
  })
  async revokeAdminUserSessions(
    @Session() session: AuthSession,
    @Param() params: AdminUserIdParamDto,
    @Req() req: FastifyRequest
  ): Promise<{ ok: true }> {
    await this.revokeSessions.execute({
      actorUserId: session.user.id,
      headers: requestHeaders(req),
      userId: params.userId,
    });
    return { ok: true };
  }

  @Patch('users/:userId/feature-flags')
  @UseGuards(AdminGuard)
  @ApiDocuvateRoute({
    operationId: 'setAdminUserFeatureFlag',
    summary: 'Set a per-tenant feature flag override',
  })
  async setAdminUserFeatureFlag(
    @Param() params: AdminUserIdParamDto,
    @Body() body: SetAdminUserFeatureFlagRequestDto
  ): Promise<FeatureFlagsResponseDto> {
    return await this.setFeatureFlagOverride.execute({
      tenantId: params.userId,
      flag: body.flag,
      enabled: body.enabled,
    });
  }
}
