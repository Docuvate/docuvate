import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  SftpIngressAccountDto,
  SftpIngressCreateAccountResponseDto,
  SftpIngressEventDto,
  SftpIngressServerInfoDto,
} from '@docuvate/contracts';
import {
  AuthGuard,
  Session,
  type AuthSession,
} from '../../../shared/infrastructure/auth/auth.guard.js';
import { ApiDocuvateController, ApiDocuvateRoute } from '../../../shared/presentation/swagger/openapi-decorators.js';
import {
  CreateSftpIngressAccountUseCase,
  GetSftpIngressServerInfoUseCase,
  ListSftpIngressAccountsUseCase,
  ListSftpIngressEventsUseCase,
  RevokeSftpIngressAccountUseCase,
} from '../application/sftp-ingress.use-cases.js';
import {
  toCreateAccountResponse,
  toSftpIngressAccountDto,
  toSftpIngressEventDto,
  toSftpIngressServerInfoDto,
} from './sftp-ingress.mapper.js';
import { SftpIngressCreateAccountBodyDto } from './dtos/sftp-ingress-user.dto.js';

@ApiDocuvateController('sftp-ingress')
@Controller('sftp-ingress')
@UseGuards(AuthGuard)
export class SftpIngressController {
  constructor(
    private readonly serverInfo: GetSftpIngressServerInfoUseCase,
    private readonly listAccounts: ListSftpIngressAccountsUseCase,
    private readonly createAccount: CreateSftpIngressAccountUseCase,
    private readonly revokeAccount: RevokeSftpIngressAccountUseCase,
    private readonly listEvents: ListSftpIngressEventsUseCase
  ) {}

  @Get('server')
  @ApiDocuvateRoute({ operationId: 'getSftpIngressServer', summary: 'SFTP scanner ingress server info' })
  getServer(@Session() session: AuthSession): SftpIngressServerInfoDto {
    void session;
    return toSftpIngressServerInfoDto(this.serverInfo.execute());
  }

  @Get('accounts')
  @ApiDocuvateRoute({ operationId: 'listSftpIngressAccounts', summary: 'List SFTP scanner ingress accounts' })
  async accounts(@Session() session: AuthSession): Promise<{ accounts: SftpIngressAccountDto[] }> {
    const rows = await this.listAccounts.execute(session.user.id);
    return { accounts: rows.map(toSftpIngressAccountDto) };
  }

  @Post('accounts')
  @ApiDocuvateRoute({ operationId: 'createSftpIngressAccount', summary: 'Create SFTP scanner ingress account' })
  async create(
    @Session() session: AuthSession,
    @Body() body: SftpIngressCreateAccountBodyDto
  ): Promise<SftpIngressCreateAccountResponseDto> {
    const result = await this.createAccount.execute(session.user.id, body);
    return toCreateAccountResponse(
      result.account,
      result.passwordPlain,
      toSftpIngressServerInfoDto(result.server)
    );
  }

  @Delete('accounts/:accountId')
  @ApiDocuvateRoute({ operationId: 'revokeSftpIngressAccount', summary: 'Revoke SFTP scanner ingress account' })
  async revoke(
    @Session() session: AuthSession,
    @Param('accountId', ParseUUIDPipe) accountId: string
  ) {
    await this.revokeAccount.execute(session.user.id, accountId);
    return { ok: true };
  }

  @Get('accounts/:accountId/events')
  @ApiDocuvateRoute({ operationId: 'listSftpIngressEvents', summary: 'List SFTP ingress events for account' })
  async events(
    @Session() session: AuthSession,
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Query('limit') limit?: string
  ): Promise<{ events: SftpIngressEventDto[] }> {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : 20;
    const safeLimit = Number.isFinite(parsedLimit) ? parsedLimit : 20;
    const rows = await this.listEvents.execute(session.user.id, accountId, safeLimit);
    return { events: rows.map(toSftpIngressEventDto) };
  }
}
