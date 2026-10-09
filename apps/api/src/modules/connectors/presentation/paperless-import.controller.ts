import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard, Session, type AuthSession } from '../../../shared/infrastructure/auth/auth.guard.js';
import { ConnectorInstallationIdParamDto } from '../../../shared/presentation/dtos/connector-actions.dto.js';
import {
  GetPaperlessImportRunUseCase,
  GetPaperlessInstallationUseCase,
  PaperlessImportDryRunUseCase,
  StartPaperlessImportUseCase,
  TestPaperlessConnectionUseCase,
  TestPaperlessInstallationConnectionUseCase,
  UpdatePaperlessInstallationUseCase,
} from '../application/paperless-import.use-cases.js';
import {
  PaperlessImportRunParamsDto,
  TestPaperlessConnectionRequestDto,
  TestPaperlessInstallationConnectionRequestDto,
  UpdatePaperlessInstallationRequestDto,
} from '../../../shared/presentation/dtos/paperless-import.dto.js';
import { toPaperlessImportRunDto } from './paperless-import.mapper.js';
import { ApiDocuvateController, ApiDocuvateRoute } from '../../../shared/presentation/swagger/openapi-decorators.js';

@ApiDocuvateController('connectors')
@Controller('connectors')
@UseGuards(AuthGuard)
export class PaperlessImportController {
  constructor(
    private readonly testConnection: TestPaperlessConnectionUseCase,
    private readonly testInstallationConnection: TestPaperlessInstallationConnectionUseCase,
    private readonly getInstallation: GetPaperlessInstallationUseCase,
    private readonly updateInstallation: UpdatePaperlessInstallationUseCase,
    private readonly dryRun: PaperlessImportDryRunUseCase,
    private readonly startImport: StartPaperlessImportUseCase,
    private readonly getRun: GetPaperlessImportRunUseCase
  ) {}

  @Post('plugins/paperless/test-connection')
  @ApiDocuvateRoute({
    operationId: 'testPaperlessConnection',
    summary: 'Validate Paperless-ngx credentials',
  })
  async testPaperless(@Body() body: TestPaperlessConnectionRequestDto) {
    const result = await this.testConnection.execute(body.credentials);
    return { ok: true as const, apiVersion: result.apiVersion };
  }

  @Get('installations/:installationId/paperless')
  @ApiDocuvateRoute({
    operationId: 'getPaperlessInstallation',
    summary: 'Get Paperless connector settings (no secrets)',
  })
  async getPaperless(
    @Session() session: AuthSession,
    @Param() params: ConnectorInstallationIdParamDto
  ) {
    return this.getInstallation.execute(session.user.id, params.installationId);
  }

  @Post('installations/:installationId/paperless/test-connection')
  @ApiDocuvateRoute({
    operationId: 'testPaperlessInstallationConnection',
    summary: 'Validate Paperless credentials for an installation',
  })
  async testPaperlessInstallation(
    @Session() session: AuthSession,
    @Param() params: ConnectorInstallationIdParamDto,
    @Body() body: TestPaperlessInstallationConnectionRequestDto
  ) {
    const result = await this.testInstallationConnection.execute(
      session.user.id,
      params.installationId,
      body.credentials ?? {}
    );
    return { ok: true as const, apiVersion: result.apiVersion };
  }

  @Put('installations/:installationId/paperless')
  @ApiDocuvateRoute({
    operationId: 'updatePaperlessInstallation',
    summary: 'Update Paperless connector installation',
  })
  async updatePaperless(
    @Session() session: AuthSession,
    @Param() params: ConnectorInstallationIdParamDto,
    @Body() body: UpdatePaperlessInstallationRequestDto
  ): Promise<{ ok: true }> {
    await this.updateInstallation.execute(session.user.id, params.installationId, body);
    return { ok: true };
  }

  @Post('installations/:installationId/paperless/dry-run')
  @ApiDocuvateRoute({
    operationId: 'paperlessImportDryRun',
    summary: 'Preview Paperless import counts',
  })
  async previewImport(
    @Session() session: AuthSession,
    @Param() params: ConnectorInstallationIdParamDto
  ) {
    const summary = await this.dryRun.execute(session.user.id, params.installationId);
    return { summary };
  }

  @Post('installations/:installationId/paperless/import')
  @ApiDocuvateRoute({
    operationId: 'startPaperlessImport',
    summary: 'Start Paperless bulk import',
  })
  async startPaperlessImport(
    @Session() session: AuthSession,
    @Param() params: ConnectorInstallationIdParamDto
  ) {
    const run = await this.startImport.execute(session.user.id, params.installationId);
    return { run: toPaperlessImportRunDto(run) };
  }

  @Get('installations/:installationId/paperless/import-runs/:runId')
  @ApiDocuvateRoute({
    operationId: 'getPaperlessImportRun',
    summary: 'Get Paperless import run status',
  })
  async getImportRun(
    @Session() session: AuthSession,
    @Param() params: PaperlessImportRunParamsDto
  ) {
    const { run, errors } = await this.getRun.execute(
      session.user.id,
      params.installationId,
      params.runId
    );
    return {
      run: toPaperlessImportRunDto(run),
      errors: errors.map((row) => ({
        id: row.id,
        sourceDocumentId: row.sourceDocumentId,
        messageKey: row.messageKey,
        messageDetail: row.messageDetail,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  @Get('installations/:installationId/paperless/import-runs/latest')
  @ApiDocuvateRoute({
    operationId: 'getLatestPaperlessImportRun',
    summary: 'Get latest Paperless import run',
  })
  async getLatestImportRun(
    @Session() session: AuthSession,
    @Param() params: ConnectorInstallationIdParamDto
  ) {
    const { run, errors } = await this.getRun.execute(session.user.id, params.installationId);
    return {
      run: toPaperlessImportRunDto(run),
      errors: errors.map((row) => ({
        id: row.id,
        sourceDocumentId: row.sourceDocumentId,
        messageKey: row.messageKey,
        messageDetail: row.messageDetail,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }
}
