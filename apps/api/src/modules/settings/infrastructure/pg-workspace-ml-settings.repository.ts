// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  DUPLICATE_DETECTION_MODES,
  FIELD_ACCEPTANCE_PRESETS,
  LABEL_AUTO_ASSIGN_PRESETS,
  LABEL_SUGGESTION_PRESETS,
} from '@docuvate/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type pg from 'pg';

import type {
  WorkspaceMlSettings,
  WorkspaceMlSettingsRepository,
} from '../../../shared/domain/ports.js';
import { parseEnum, recordFromUnknown } from '../../../shared/infrastructure/database/row-parse.js';
import { PG_POOL } from '../../../shared/infrastructure/database/tokens.js';
import { INSTALLATION_TENANT_ID } from '../../auth/domain/installation.constants.js';

export const WORKSPACE_ML_SETTINGS_DEFAULTS: WorkspaceMlSettings = {
  labelAutoAssign: 'normal',
  labelSuggestions: 'normal',
  duplicateDetection: 'exact',
  fieldAcceptance: 'normal',
};

const SELECT_COLUMNS = `label_auto_assign, label_suggestions, duplicate_detection, field_acceptance`;

function mapRow(raw: unknown): WorkspaceMlSettings {
  const row = recordFromUnknown(raw);
  if (!row) {
    return WORKSPACE_ML_SETTINGS_DEFAULTS;
  }
  const defaults = WORKSPACE_ML_SETTINGS_DEFAULTS;
  return {
    labelAutoAssign: parseEnum(row.label_auto_assign, LABEL_AUTO_ASSIGN_PRESETS, defaults.labelAutoAssign),
    labelSuggestions: parseEnum(row.label_suggestions, LABEL_SUGGESTION_PRESETS, defaults.labelSuggestions),
    duplicateDetection: parseEnum(
      row.duplicate_detection,
      DUPLICATE_DETECTION_MODES,
      defaults.duplicateDetection
    ),
    fieldAcceptance: parseEnum(row.field_acceptance, FIELD_ACCEPTANCE_PRESETS, defaults.fieldAcceptance),
  };
}

@Injectable()
export class PgWorkspaceMlSettingsRepository implements WorkspaceMlSettingsRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async get(): Promise<WorkspaceMlSettings> {
    const result = await this.pool.query(
      `SELECT ${SELECT_COLUMNS} FROM workspace_ml_settings WHERE tenant_id = $1`,
      [INSTALLATION_TENANT_ID]
    );
    return mapRow(result.rows[0]);
  }

  async update(
    patch: Partial<WorkspaceMlSettings>,
    updatedByUserId: string
  ): Promise<WorkspaceMlSettings> {
    const next: WorkspaceMlSettings = { ...(await this.get()), ...patch };
    const result = await this.pool.query(
      `INSERT INTO workspace_ml_settings (
         tenant_id, label_auto_assign, label_suggestions, duplicate_detection, field_acceptance,
         updated_by_user_id, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, now())
       ON CONFLICT (tenant_id) DO UPDATE SET
         label_auto_assign = EXCLUDED.label_auto_assign,
         label_suggestions = EXCLUDED.label_suggestions,
         duplicate_detection = EXCLUDED.duplicate_detection,
         field_acceptance = EXCLUDED.field_acceptance,
         updated_by_user_id = EXCLUDED.updated_by_user_id,
         updated_at = now()
       RETURNING ${SELECT_COLUMNS}`,
      [
        INSTALLATION_TENANT_ID,
        next.labelAutoAssign,
        next.labelSuggestions,
        next.duplicateDetection,
        next.fieldAcceptance,
        updatedByUserId,
      ]
    );
    return mapRow(result.rows[0]);
  }
}
