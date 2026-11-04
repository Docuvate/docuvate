// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it, vi } from 'vitest';

import { ForbiddenError } from '../../../shared/domain/errors.js';
import { UpdateWorkspaceMlSettingsRequestDto } from '../../../shared/presentation/dtos/workspace-ml-settings.dto.js';
import {
  createWorkspaceMlSettings,
  createWorkspaceMlSettingsRepositoryStub,
} from '../../../test-support/workspace-ml-settings-repository.stub.js';
import type { InstallationRoleReader } from '../../workspace/domain/installation-role.port.js';
import {
  GetWorkspaceMlSettingsUseCase,
  UpdateWorkspaceMlSettingsUseCase,
} from './workspace-ml-settings.use-cases.js';

function roles(isAdmin: boolean): InstallationRoleReader {
  return { isInstallationAdmin: vi.fn().mockResolvedValue(isAdmin) };
}

describe('GetWorkspaceMlSettingsUseCase', () => {
  it('lets members read the settings without editing rights', async () => {
    const repo = createWorkspaceMlSettingsRepositoryStub(
      createWorkspaceMlSettings({ duplicateDetection: 'similar' })
    );
    const result = await new GetWorkspaceMlSettingsUseCase(repo, roles(false)).execute('member');
    expect(result).toEqual({
      labelAutoAssign: 'normal',
      labelSuggestions: 'normal',
      duplicateDetection: 'similar',
      fieldAcceptance: 'normal',
      editable: false,
    });
  });

  it('marks the settings editable for installation admins', async () => {
    const repo = createWorkspaceMlSettingsRepositoryStub();
    const result = await new GetWorkspaceMlSettingsUseCase(repo, roles(true)).execute('admin');
    expect(result.editable).toBe(true);
  });
});

describe('UpdateWorkspaceMlSettingsUseCase', () => {
  it('rejects members with ForbiddenError and stores nothing', async () => {
    const repo = createWorkspaceMlSettingsRepositoryStub();
    const useCase = new UpdateWorkspaceMlSettingsUseCase(repo, roles(false));
    await expect(useCase.execute('member', { duplicateDetection: 'off' })).rejects.toBeInstanceOf(
      ForbiddenError
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('stores the patch for admins and records who changed it', async () => {
    const repo = createWorkspaceMlSettingsRepositoryStub();
    const result = await new UpdateWorkspaceMlSettingsUseCase(repo, roles(true)).execute('admin', {
      labelAutoAssign: 'off',
    });
    expect(repo.update).toHaveBeenCalledWith({ labelAutoAssign: 'off' }, 'admin');
    expect(result.labelAutoAssign).toBe('off');
    expect(result.editable).toBe(true);
  });
});

describe('UpdateWorkspaceMlSettingsRequestDto', () => {
  it('accepts known presets', async () => {
    const dto = plainToInstance(UpdateWorkspaceMlSettingsRequestDto, {
      labelAutoAssign: 'cautious',
      labelSuggestions: 'few',
      duplicateDetection: 'similar',
      fieldAcceptance: 'generous',
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejects unknown values', async () => {
    const dto = plainToInstance(UpdateWorkspaceMlSettingsRequestDto, {
      labelAutoAssign: 'always',
      duplicateDetection: true,
    });
    const errors = await validate(dto);
    expect(errors.map((error) => error.property).sort()).toEqual([
      'duplicateDetection',
      'labelAutoAssign',
    ]);
  });
});
