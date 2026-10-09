// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it, vi } from 'vitest';
import { ConflictError } from '../../../shared/domain/errors.js';
import { StartPaperlessImportUseCase } from './paperless-import.use-cases.js';

describe('StartPaperlessImportUseCase', () => {
  it('throws ConflictError when an import is already active', async () => {
    const runtime = {
      resolve: vi.fn().mockResolvedValue({ pluginId: 'paperless', credentials: {} }),
    };
    const imports = {
      findActiveRunForInstallation: vi.fn().mockResolvedValue({ id: 'run-active' }),
      getInstallationSettings: vi.fn(),
      getSyncWatermark: vi.fn(),
      createRun: vi.fn(),
    };
    const queue = { enqueue: vi.fn() };
    const useCase = new StartPaperlessImportUseCase(
      runtime as never,
      imports as never,
      queue as never
    );

    await expect(useCase.execute('user-1', 'install-1')).rejects.toBeInstanceOf(ConflictError);
    expect(imports.createRun).not.toHaveBeenCalled();
    expect(queue.enqueue).not.toHaveBeenCalled();
  });
});
