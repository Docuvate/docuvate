// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  ConnectorCatalogResponse,
  ConnectorImportableItemDto,
  ConnectorInstallationDto,
  ConnectorPluginCatalogEntryDto,
} from '@docuvate/contracts';
import type { SftpFetchHostProbeRequest, SftpFetchHostProbeResponse } from '@docuvate/contracts';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import type { AuthorizationSubject } from '../../../shared/domain/authorization.js';
import {
  AuthGuard,
  type AuthSession,
  AuthSubject,
  Session,
} from '../../../shared/infrastructure/auth/auth.guard.js';
import { isInstanceAdmin } from '../../../shared/infrastructure/auth/user-authorization-subject.js';
import {
  ConnectorInstallationIdParamDto,
  ExportToConnectorRequestDto,
  ImportFromConnectorRequestDto,
  ListConnectorImportablesQueryDto,
} from '../../../shared/presentation/dtos/connector-actions.dto.js';
import {
  ConnectorPluginIdParamDto,
  CreateConnectorInstallationRequestDto,
} from '../../../shared/presentation/dtos/connectors.dto.js';
import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';
import { toDocumentDto } from '../../documents/presentation/document.mapper.js';
import {
  CreateConnectorInstallationUseCase,
  DeleteConnectorInstallationUseCase,
  GetConnectorCatalogUseCase,
  GetConnectorPluginUseCase,
  ListConnectorInstallationsUseCase,
} from '../application/connector.use-cases.js';
import {
  ExportToConnectorUseCase,
  ImportFromConnectorUseCase,
  ListConnectorImportablesUseCase,
} from '../application/connector-sync.use-cases.js';
import { probeSftpFetchHost } from '../infrastructure/adapters/sftp/sftp-fetch.connector.js';
import { toConnectorInstallationDto } from './connectors.mapper.js';

@ApiDocuvateController('connectors')
@Controller('connectors')
@UseGuards(AuthGuard)
export class ConnectorsController {
  constructor(
    private readonly catalog: GetConnectorCatalogUseCase,
    private readonly getPlugin: GetConnectorPluginUseCase,
    private readonly listInstallations: ListConnectorInstallationsUseCase,
    private readonly createInstallation: CreateConnectorInstallationUseCase,
    private readonly deleteInstallation: DeleteConnectorInstallationUseCase,
    private readonly listImportables: ListConnectorImportablesUseCase,
    private readonly importFromConnector: ImportFromConnectorUseCase,
    private readonly exportToConnector: ExportToConnectorUseCase
  ) {}

  @Get('catalog')
  @ApiDocuvateRoute({ operationId: 'getConnectorCatalog', summary: 'Connector plugin catalog' })
  getCatalog(@AuthSubject() subject: AuthorizationSubject): ConnectorCatalogResponse {
    const viewerIsServerAdmin = isInstanceAdmin(subject);
    return this.catalog.execute({ viewerIsServerAdmin });
  }

  @Get('plugins/:pluginId')
  @ApiDocuvateRoute({ operationId: 'getConnectorPlugin', summary: 'Connector plugin descriptor' })
  getPluginSchema(@Param() params: ConnectorPluginIdParamDto): ConnectorPluginCatalogEntryDto {
    return this.getPlugin.execute(params.pluginId);
  }

  @Get('installations')
  @ApiDocuvateRoute({
    operationId: 'listConnectorInstallations',
    summary: 'List connector installations',
  })
  async list(
    @Session() session: AuthSession
  ): Promise<{ installations: ConnectorInstallationDto[] }> {
    const rows = await this.listInstallations.execute(session.user.id);
    return { installations: rows.map(toConnectorInstallationDto) };
  }

  @Post('installations')
  @ApiDocuvateRoute({
    operationId: 'createConnectorInstallation',
    summary: 'Create connector installation',
  })
  async create(
    @Session() session: AuthSession,
    @Body() body: CreateConnectorInstallationRequestDto
  ): Promise<ConnectorInstallationDto> {
    const row = await this.createInstallation.execute(session.user.id, body);
    return toConnectorInstallationDto(row);
  }

  @Delete('installations/:installationId')
  @HttpCode(204)
  @ApiDocuvateRoute({
    operationId: 'deleteConnectorInstallation',
    summary: 'Delete connector installation',
  })
  async remove(
    @Session() session: AuthSession,
    @Param('installationId') installationId: string
  ): Promise<void> {
    await this.deleteInstallation.execute(session.user.id, installationId);
  }

  @Get('installations/:installationId/importables')
  @ApiDocuvateRoute({ operationId: 'importables', summary: 'importables' })
  async importables(
    @Session() session: AuthSession,
    @Param() params: ConnectorInstallationIdParamDto,
    @Query() query: ListConnectorImportablesQueryDto
  ): Promise<{ items: ConnectorImportableItemDto[] }> {
    const items = await this.listImportables.execute(
      session.user.id,
      params.installationId,
      query.limit ?? 20
    );
    return { items };
  }

  @Post('installations/:installationId/import')
  @ApiDocuvateRoute({ operationId: 'importOne', summary: 'importOne' })
  async importOne(
    @Session() session: AuthSession,
    @Param() params: ConnectorInstallationIdParamDto,
    @Body() body: ImportFromConnectorRequestDto
  ) {
    const doc = await this.importFromConnector.execute(
      session.user.id,
      params.installationId,
      body.ref
    );
    return { document: toDocumentDto(doc) };
  }

  @Post('plugins/sftp_fetch/probe-host-key')
  @ApiDocuvateRoute({
    operationId: 'probeSftpFetchHostKey',
    summary: 'Probe remote SFTP host key fingerprint',
  })
  async probeSftpHost(
    @Body() body: SftpFetchHostProbeRequest
  ): Promise<SftpFetchHostProbeResponse> {
    return probeSftpFetchHost({
      host: body.host,
      port: String(body.port ?? 22),
      username: body.username,
      password: body.password ?? '',
      private_key: body.privateKey ?? '',
      remote_path: '/',
      host_key_fingerprint: 'probe',
      poll_interval_seconds: '300',
      after_import: 'delete',
    });
  }

  @Post('installations/:installationId/export')
  @ApiDocuvateRoute({ operationId: 'exportOne', summary: 'exportOne' })
  async exportOne(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject,
    @Param() params: ConnectorInstallationIdParamDto,
    @Body() body: ExportToConnectorRequestDto
  ): Promise<{ ref: string }> {
    return this.exportToConnector.execute(
      session.user.id,
      params.installationId,
      body.documentId,
      subject,
      body.destinationRef
    );
  }
}
