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
  Patch,
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
  ListConnectorSourceNodesQueryDto,
  PreviewConnectorSourceNodesRequestDto,
  UpdateConnectorInstallationRequestDto,
} from '../../../shared/presentation/dtos/connectors.dto.js';
import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';
import { toDocumentDto } from '../../documents/presentation/document.mapper.js';
import { ResolveFeatureFlagsUseCase } from '../../feature-flags/application/resolve-feature-flags.use-case.js';
import {
  CreateConnectorInstallationUseCase,
  DeleteConnectorInstallationUseCase,
  GetConnectorCatalogUseCase,
  GetConnectorInstallationUseCase,
  GetConnectorPluginUseCase,
  ListConnectorInstallationsUseCase,
  UpdateConnectorInstallationUseCase,
} from '../application/connector.use-cases.js';
import { ListConnectorSourceNodesUseCase } from '../application/connector-source-nodes.use-cases.js';
import {
  ExportToConnectorUseCase,
  ImportFromConnectorUseCase,
  ListConnectorImportablesUseCase,
} from '../application/connector-sync.use-cases.js';
import { probeSftpFetchHost } from '../infrastructure/adapters/sftp/sftp-fetch.connector.js';
import { PgConnectorSourceScopeRepository } from '../infrastructure/pg-connector-source-scope.repository.js';
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
    private readonly getInstallation: GetConnectorInstallationUseCase,
    private readonly updateInstallation: UpdateConnectorInstallationUseCase,
    private readonly deleteInstallation: DeleteConnectorInstallationUseCase,
    private readonly listSourceNodes: ListConnectorSourceNodesUseCase,
    private readonly sourceScopes: PgConnectorSourceScopeRepository,
    private readonly listImportables: ListConnectorImportablesUseCase,
    private readonly importFromConnector: ImportFromConnectorUseCase,
    private readonly exportToConnector: ExportToConnectorUseCase,
    private readonly resolveFeatureFlags: ResolveFeatureFlagsUseCase
  ) {}

  @Get('catalog')
  @ApiDocuvateRoute({ operationId: 'getConnectorCatalog', summary: 'Connector plugin catalog' })
  async getCatalog(
    @Session() session: AuthSession,
    @AuthSubject() subject: AuthorizationSubject
  ): Promise<ConnectorCatalogResponse> {
    const viewerIsServerAdmin = isInstanceAdmin(subject);
    return this.catalog.execute({ viewerIsServerAdmin, tenantId: session.user.id });
  }

  @Get('plugins/:pluginId')
  @ApiDocuvateRoute({ operationId: 'getConnectorPlugin', summary: 'Connector plugin descriptor' })
  async getPluginSchema(
    @Session() session: AuthSession,
    @Param() params: ConnectorPluginIdParamDto
  ): Promise<ConnectorPluginCatalogEntryDto> {
    return this.getPlugin.execute(session.user.id, params.pluginId);
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
    const scopeMap = await this.sourceScopes.getScopesForInstallations(rows.map((row) => row.id));
    return {
      installations: rows.map((row) =>
        toConnectorInstallationDto(row, scopeMap.get(row.id) ?? { mode: 'all', paths: [] })
      ),
    };
  }

  @Get('installations/:installationId')
  @ApiDocuvateRoute({
    operationId: 'getConnectorInstallation',
    summary: 'Get connector installation',
  })
  async getOne(
    @Session() session: AuthSession,
    @Param('installationId') installationId: string
  ): Promise<ConnectorInstallationDto> {
    const { installation, sourceScope } = await this.getInstallation.execute(
      session.user.id,
      installationId
    );
    return toConnectorInstallationDto(installation, sourceScope);
  }

  @Patch('installations/:installationId')
  @ApiDocuvateRoute({
    operationId: 'updateConnectorInstallation',
    summary: 'Update connector installation',
  })
  async updateOne(
    @Session() session: AuthSession,
    @Param('installationId') installationId: string,
    @Body() body: UpdateConnectorInstallationRequestDto
  ): Promise<ConnectorInstallationDto> {
    const { installation, sourceScope } = await this.updateInstallation.execute(
      session.user.id,
      installationId,
      body
    );
    return toConnectorInstallationDto(installation, sourceScope);
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
    const sourceScope = await this.sourceScopes.getScope(row.id);
    return toConnectorInstallationDto(row, sourceScope);
  }

  @Get('installations/:installationId/source-nodes')
  @ApiDocuvateRoute({
    operationId: 'listConnectorInstallationSourceNodes',
    summary: 'List remote source nodes for a connector installation',
  })
  async installationSourceNodes(
    @Session() session: AuthSession,
    @Param('installationId') installationId: string,
    @Query() query: ListConnectorSourceNodesQueryDto
  ) {
    return this.listSourceNodes.executeForInstallation(
      session.user.id,
      installationId,
      query.parentPath ?? ''
    );
  }

  @Post('plugins/:pluginId/source-nodes/preview')
  @ApiDocuvateRoute({
    operationId: 'previewConnectorSourceNodes',
    summary: 'Preview remote source nodes before saving credentials',
  })
  async previewSourceNodes(
    @Session() session: AuthSession,
    @Param() params: ConnectorPluginIdParamDto,
    @Body() body: PreviewConnectorSourceNodesRequestDto
  ) {
    return this.listSourceNodes.executePreview(
      session.user.id,
      params.pluginId,
      body.credentials,
      body.parentPath ?? ''
    );
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
    @Session() session: AuthSession,
    @Body() body: SftpFetchHostProbeRequest
  ): Promise<SftpFetchHostProbeResponse> {
    await this.resolveFeatureFlags.assertEnabled(session.user.id, 'sourceConnectors');
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
