// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';

import {
  AuthGuard,
  type AuthSession,
  Session,
} from '../../../shared/infrastructure/auth/auth.guard.js';
import {
  DashboardLayoutResponseDto,
  DashboardStatisticsDtoClass,
  InstallationDashboardDefaultResponseDto,
  ReplaceDashboardLayoutRequestDto,
} from '../../../shared/presentation/dtos/workspace.dto.js';
import {
  ApiDocuvateController,
  ApiDocuvateRoute,
} from '../../../shared/presentation/swagger/openapi-decorators.js';
import {
  GetDashboardLayoutUseCase,
  GetDashboardStatisticsUseCase,
  GetInstallationAdminStatusUseCase,
  GetInstallationDashboardDefaultUseCase,
  ReplaceDashboardLayoutUseCase,
  SetInstallationDashboardDefaultUseCase,
} from '../application/workspace.use-cases.js';
import { toDashboardWidgetDto } from './workspace.mapper.js';

@ApiDocuvateController('workspace')
@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(
    private readonly getLayout: GetDashboardLayoutUseCase,
    private readonly replaceLayout: ReplaceDashboardLayoutUseCase,
    private readonly getStatistics: GetDashboardStatisticsUseCase,
    private readonly getInstallationDefault: GetInstallationDashboardDefaultUseCase,
    private readonly setInstallationDefault: SetInstallationDashboardDefaultUseCase,
    private readonly installationAdmin: GetInstallationAdminStatusUseCase
  ) {}

  @Get('installation-admin')
  @ApiDocuvateRoute({
    operationId: 'getInstallationAdminStatus',
    summary: 'Whether the current user is an installation admin (ADR 019)',
  })
  async installationAdminStatus(
    @Session() session: AuthSession
  ): Promise<{ isInstallationAdmin: boolean }> {
    const isInstallationAdmin = await this.installationAdmin.execute(session.user.id);
    return { isInstallationAdmin };
  }

  @Get()
  @ApiDocuvateRoute({ operationId: 'getDashboardLayout', summary: 'Get personal dashboard layout' })
  async layout(@Session() session: AuthSession): Promise<DashboardLayoutResponseDto> {
    const widgets = await this.getLayout.execute(session.user.id);
    return { widgets: widgets.map(toDashboardWidgetDto), editMode: false };
  }

  @Put()
  @ApiDocuvateRoute({
    operationId: 'replaceDashboardLayout',
    summary: 'Replace personal dashboard layout',
  })
  async replace(
    @Session() session: AuthSession,
    @Body() body: ReplaceDashboardLayoutRequestDto
  ): Promise<DashboardLayoutResponseDto> {
    const widgets = await this.replaceLayout.execute(session.user.id, body);
    return { widgets: widgets.map(toDashboardWidgetDto), editMode: false };
  }

  @Get('statistics')
  @ApiDocuvateRoute({
    operationId: 'getDashboardStatistics',
    summary: 'Dashboard document statistics',
  })
  async statistics(@Session() session: AuthSession): Promise<DashboardStatisticsDtoClass> {
    const stats = await this.getStatistics.execute(session.user.id);
    return {
      documentsTotal: stats.documentsTotal,
      byStatus: stats.byStatus,
      labelsAssignedCount: stats.labelsAssignedCount,
      unlabeledCount: stats.unlabeledCount,
      topLabels: stats.topLabels,
    };
  }

  @Get('installation-default')
  @ApiDocuvateRoute({
    operationId: 'getInstallationDashboardDefault',
    summary: 'Installation default dashboard template',
  })
  async installationDefault(): Promise<InstallationDashboardDefaultResponseDto> {
    const template = await this.getInstallationDefault.execute();
    return {
      widgets: template.map((w) => ({
        type: w.type,
        position: w.position,
        widthCols: w.widthCols,
        heightRows: w.heightRows,
        savedViewId: w.savedViewId,
        itemLimit: w.itemLimit,
      })),
    };
  }

  @Put('installation-default')
  @ApiDocuvateRoute({
    operationId: 'setInstallationDashboardDefault',
    summary: 'Set installation default dashboard (admin)',
  })
  async setInstallationDefaultLayout(
    @Session() session: AuthSession,
    @Body() body: ReplaceDashboardLayoutRequestDto
  ): Promise<InstallationDashboardDefaultResponseDto> {
    const template = await this.setInstallationDefault.execute(session.user.id, body);
    return {
      widgets: template.map((w) => ({
        type: w.type,
        position: w.position,
        widthCols: w.widthCols,
        heightRows: w.heightRows,
        savedViewId: w.savedViewId,
        itemLimit: w.itemLimit,
      })),
    };
  }
}
