// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { FIELD_ACCEPTANCE_LABEL_CONFIDENCE } from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';

import {
  USER_PREFERENCES_REPOSITORY,
  type UserPreferencesRepository,
  WORKSPACE_ML_SETTINGS_REPOSITORY,
  type WorkspaceMlSettingsRepository,
} from '../../../shared/domain/ports.js';
import type { FieldGateDefaults } from '../domain/field-gate-defaults.js';

@Injectable()
export class FieldGateDefaultsReader {
  constructor(
    @Inject(USER_PREFERENCES_REPOSITORY) private readonly prefs: UserPreferencesRepository,
    @Inject(WORKSPACE_ML_SETTINGS_REPOSITORY)
    private readonly workspace: WorkspaceMlSettingsRepository
  ) {}

  async read(userId: string): Promise<FieldGateDefaults> {
    const [prefs, workspace] = await Promise.all([
      this.prefs.getForUser(userId),
      this.workspace.get(),
    ]);
    return {
      confidenceGateEnabled: prefs.fieldExtractionConfidenceGateEnabled,
      minLabelConfidence: FIELD_ACCEPTANCE_LABEL_CONFIDENCE[workspace.fieldAcceptance],
      requiredLabelIds: prefs.fieldExtractionRequiredLabelIds,
    };
  }
}
