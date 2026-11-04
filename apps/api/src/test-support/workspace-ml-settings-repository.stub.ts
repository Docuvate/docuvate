// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { type Mock, vi } from 'vitest';

import type { WorkspaceMlSettings, WorkspaceMlSettingsRepository } from '../shared/domain/ports.js';

export function createWorkspaceMlSettings(
  overrides: Partial<WorkspaceMlSettings> = {}
): WorkspaceMlSettings {
  return {
    labelAutoAssign: 'normal',
    labelSuggestions: 'normal',
    duplicateDetection: 'exact',
    fieldAcceptance: 'normal',
    ...overrides,
  };
}

interface WorkspaceMlSettingsRepositoryStub {
  get: Mock<WorkspaceMlSettingsRepository['get']>;
  update: Mock<WorkspaceMlSettingsRepository['update']>;
}

export function createWorkspaceMlSettingsRepositoryStub(
  settings: WorkspaceMlSettings = createWorkspaceMlSettings()
): WorkspaceMlSettingsRepositoryStub {
  return {
    get: vi.fn<WorkspaceMlSettingsRepository['get']>().mockResolvedValue(settings),
    update: vi.fn<WorkspaceMlSettingsRepository['update']>((patch) =>
      Promise.resolve({ ...settings, ...patch })
    ),
  };
}
