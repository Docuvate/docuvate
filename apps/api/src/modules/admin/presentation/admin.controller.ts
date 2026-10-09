import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { fromNodeHeaders } from 'better-auth/node';
import {
  AuthGuard,
  AuthSubject,
  Session,
  type AuthSession,
} from '../../../shared/infrastructure/auth/auth.guard.js';
import { AdminGuard } from '../../../shared/infrastructure/auth/admin.guard.js';
import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import {
  AdminAccessResponseDto,
  AdminUserIdParamDto,
  AdminUserListResponseDto,
  BanAdminUserRequestDto,
  InviteAdminUserRequestDto,
  ListAdminUsersQueryDto,
  SetAdminUserRoleRequestDto,
} from '../../../shared/presentation/dtos/admin.dto.js';
import { ApiDocuvateController, ApiDocuvateRoute } from '../../../shared/presentation/swagger/openapi-decorators.js';
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
import { INSTANCE_ROLE_MEMBER } from '../../auth/domain/instance-role.constants.js';
import { toAdminUserDto } from './admin.mapper.js';

function requestHeaders(req: FastifyRequest): Headers {
  return fromNodeHeaders(req.headers as Record<string, string | string[] | undefined>);
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
    private readonly revokeInvitation: RevokeAdminUserInvitationUseCase
  ) {}

  @Get('access')
  @ApiDocuvateRoute({ operationId: 'getAdminAccess', summary: 'Viewer administration access' })
  getAccess(@AuthSubject() subject: AuthorizationSubject): AdminAccessResponseDto {
    return this.access.execute(subject);
  }

  @Get('users')
  @UseGuards(AdminGuard)
  @ApiDocuvateRoute({ operationId: 'listAdminUsers', summary: 'List instance users' })
  async listAdminUsers(
    @Query() query: ListAdminUsersQueryDto,
    @Req() req: FastifyRequest
  ): Promise<AdminUserListResponseDto> {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;
    const result = await this.listUsers.execute({
      headers: requestHeaders(req),
      limit,
      offset,
      search: query.search,
    });
    return {
      users: result.users.map(toAdminUserDto),
      total: result.total,
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
  @ApiDocuvateRoute({ operationId: 'revokeAdminUserInvitation', summary: 'Revoke pending invitation' })
  async revokeAdminUserInvitation(
    @Session() session: AuthSession,
    @Param() params: AdminUserIdParamDto,
    @Req() req: FastifyRequest
  ): Promise<{ ok: true }> {
    await this.revokeInvitation.execute({
      actorUserId: session.user.id,
      invitationId: params.userId,
    });
    return { ok: true };
  }

  @Post('users/:userId/revoke-sessions')
  @UseGuards(AdminGuard)
  @ApiDocuvateRoute({ operationId: 'revokeAdminUserSessions', summary: 'Revoke all sessions for a user' })
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

}
