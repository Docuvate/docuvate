// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Module } from '@nestjs/common';

import {
  CreateSavedViewUseCase,
  DeleteSavedViewUseCase,
  GetDashboardLayoutUseCase,
  GetDashboardStatisticsUseCase,
  GetInstallationAdminStatusUseCase,
  GetInstallationDashboardDefaultUseCase,
  GetSavedViewUseCase,
  ListSavedViewsUseCase,
  ReorderSavedViewsUseCase,
  ReplaceDashboardLayoutUseCase,
  SetInstallationDashboardDefaultUseCase,
  UpdateSavedViewUseCase,
} from './application/workspace.use-cases.js';
import { INSTALLATION_ROLE_READER } from './domain/installation-role.port.js';
import { PgInstallationRoleReader } from './infrastructure/pg-installation-role.reader.js';
import { PgWorkspaceRepository } from './infrastructure/pg-workspace.repository.js';
import { SavedViewScopeValidator } from './infrastructure/saved-view-scope.validator.js';
import { DashboardController } from './presentation/dashboard.controller.js';
import { SavedViewsController } from './presentation/saved-views.controller.js';

@Module({
  controllers: [SavedViewsController, DashboardController],
  providers: [
    PgWorkspaceRepository,
    SavedViewScopeValidator,
    PgInstallationRoleReader,
    { provide: INSTALLATION_ROLE_READER, useExisting: PgInstallationRoleReader },
    ListSavedViewsUseCase,
    GetSavedViewUseCase,
    CreateSavedViewUseCase,
    UpdateSavedViewUseCase,
    DeleteSavedViewUseCase,
    ReorderSavedViewsUseCase,
    GetDashboardLayoutUseCase,
    ReplaceDashboardLayoutUseCase,
    GetDashboardStatisticsUseCase,
    GetInstallationDashboardDefaultUseCase,
    SetInstallationDashboardDefaultUseCase,
    GetInstallationAdminStatusUseCase,
  ],
  exports: [GetInstallationAdminStatusUseCase, INSTALLATION_ROLE_READER],
})
// Nest requires a module class token; this module has no instance state.
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest @Module() host
export class WorkspaceModule {}
