// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { UpdateWorkspaceMlSettingsRequest, WorkspaceMlSettingsDto } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import { ForbiddenError } from '../../../shared/domain/errors.js';
import {
  WORKSPACE_ML_SETTINGS_REPOSITORY,
  type WorkspaceMlSettingsRepository,
} from '../../../shared/domain/ports.js';
import {
  INSTALLATION_ROLE_READER,
  type InstallationRoleReader,
} from '../../workspace/domain/installation-role.port.js';

@Injectable()
export class GetWorkspaceMlSettingsUseCase {
  constructor(
    @Inject(WORKSPACE_ML_SETTINGS_REPOSITORY)
    private readonly settings: WorkspaceMlSettingsRepository,
    @Inject(INSTALLATION_ROLE_READER) private readonly roles: InstallationRoleReader
  ) {}

  async execute(userId: string): Promise<WorkspaceMlSettingsDto> {
    const [settings, editable] = await Promise.all([
      this.settings.get(),
      this.roles.isInstallationAdmin(userId),
    ]);
    return { ...settings, editable };
  }
}

@Injectable()
export class UpdateWorkspaceMlSettingsUseCase {
  constructor(
    @Inject(WORKSPACE_ML_SETTINGS_REPOSITORY)
    private readonly settings: WorkspaceMlSettingsRepository,
    @Inject(INSTALLATION_ROLE_READER) private readonly roles: InstallationRoleReader
  ) {}

  async execute(
    userId: string,
    patch: UpdateWorkspaceMlSettingsRequest
  ): Promise<WorkspaceMlSettingsDto> {
    if (!(await this.roles.isInstallationAdmin(userId))) {
      throw new ForbiddenError();
    }
    const settings = await this.settings.update(patch, userId);
    return { ...settings, editable: true };
  }
}
