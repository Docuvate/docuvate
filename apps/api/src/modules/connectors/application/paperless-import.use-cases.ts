// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Inject, Injectable } from '@nestjs/common';
import { ConflictError, NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import {
  CONNECTOR_INSTALLATION_REPOSITORY,
  type ConnectorInstallationRepository,
} from '../domain/connector.ports.js';
import { ConnectorRuntimeResolver } from './connector-runtime.resolver.js';
import { PaperlessImportExecutor } from '../infrastructure/adapters/paperless/paperless-import.executor.js';
import { PaperlessImportRepository } from '../infrastructure/adapters/paperless/paperless-import.repository.js';
import { PaperlessImportQueueService } from '../infrastructure/adapters/paperless/paperless-import.queue.js';
import type { PaperlessOcrMode } from '../infrastructure/adapters/paperless/paperless-field-mapping.js';
import { validatePaperlessConnection } from '../infrastructure/adapters/paperless/paperless-api.client.js';
import { mapPaperlessClientError } from '../infrastructure/adapters/paperless/paperless-errors.js';
import type { ConnectorConfigurationInput } from '../domain/connector.types.js';

function coerceCredentialPatch(patch: Record<string, unknown>): Record<string, string> {
  const keys = ['base_url', 'api_token', 'username', 'password'] as const;
  const out: Record<string, string> = {};
  for (const key of keys) {
    const value = patch[key];
    if (value === undefined || value === null) {
      continue;
    }
    if (typeof value !== 'string') {
      throw new ValidationError('connectors.paperless.errors.invalidCredentials');
    }
    out[key] = value;
  }
  return out;
}

function mergePaperlessCredentials(
  existing: ConnectorConfigurationInput,
  patch: Record<string, string>
): ConnectorConfigurationInput {
  const merged: ConnectorConfigurationInput = { ...existing };
  if (patch['base_url']?.trim()) {
    merged['base_url'] = patch['base_url'].trim();
  }
  if (patch['api_token']?.trim()) {
    merged['api_token'] = patch['api_token'].trim();
  }
  if (patch['username']?.trim()) {
    merged['username'] = patch['username'].trim();
  }
  if (patch['password']?.trim()) {
    merged['password'] = patch['password'].trim();
  }
  return merged;
}

@Injectable()
export class TestPaperlessConnectionUseCase {
  async execute(credentials: Record<string, unknown>): Promise<{ apiVersion: number }> {
    try {
      return await validatePaperlessConnection(coerceCredentialPatch(credentials));
    } catch (err: unknown) {
      throw mapPaperlessClientError(err);
    }
  }
}

@Injectable()
export class TestPaperlessInstallationConnectionUseCase {
  constructor(
    @Inject(CONNECTOR_INSTALLATION_REPOSITORY)
    private readonly installations: ConnectorInstallationRepository,
    private readonly testConnection: TestPaperlessConnectionUseCase
  ) {}

  async execute(
    userId: string,
    installationId: string,
    patch: Record<string, unknown>
  ): Promise<{ apiVersion: number }> {
    const row = await this.installations.findByIdForUser(userId, installationId);
    if (!row || row.pluginId !== 'paperless') {
      throw new NotFoundError('Connector installation');
    }
    const merged = mergePaperlessCredentials(row.credentials, coerceCredentialPatch(patch));
    return this.testConnection.execute(merged);
  }
}

@Injectable()
export class GetPaperlessInstallationUseCase {
  constructor(
    @Inject(CONNECTOR_INSTALLATION_REPOSITORY)
    private readonly installations: ConnectorInstallationRepository,
    private readonly imports: PaperlessImportRepository
  ) {}

  async execute(userId: string, installationId: string) {
    const row = await this.installations.findByIdForUser(userId, installationId);
    if (!row || row.pluginId !== 'paperless') {
      throw new NotFoundError('Connector installation');
    }
    const settings = await this.imports.getInstallationSettings(installationId, userId);
    const creds = row.credentials;
    return {
      displayName: row.displayName,
      baseUrl: creds['base_url']?.trim() ?? '',
      hasStoredApiToken: Boolean(creds['api_token']?.trim()),
      hasStoredUsername: Boolean(creds['username']?.trim()),
      hasStoredPassword: Boolean(creds['password']?.trim()),
      keepOcrText: settings?.keepOcrText ?? true,
      rerunOcr: settings?.rerunOcr ?? false,
      includeArchivedPdf: settings?.includeArchivedPdf ?? false,
      lastSuccessfulModifiedAt:
        (await this.imports.getSyncWatermark(installationId))?.toISOString() ?? null,
    };
  }
}

@Injectable()
export class UpdatePaperlessInstallationUseCase {
  constructor(
    @Inject(CONNECTOR_INSTALLATION_REPOSITORY)
    private readonly installations: ConnectorInstallationRepository,
    private readonly imports: PaperlessImportRepository,
    private readonly testConnection: TestPaperlessConnectionUseCase
  ) {}

  async execute(
    userId: string,
    installationId: string,
    body: {
      displayName?: string;
      credentials?: Record<string, string>;
      keepOcrText?: boolean;
      rerunOcr?: boolean;
      includeArchivedPdf?: boolean;
    }
  ): Promise<void> {
    const row = await this.installations.findByIdForUser(userId, installationId);
    if (!row || row.pluginId !== 'paperless') {
      throw new NotFoundError('Connector installation');
    }
    if (
      body.credentials &&
      Object.values(body.credentials).some((v) => typeof v === 'string' && v.trim().length > 0)
    ) {
      const merged = mergePaperlessCredentials(
        row.credentials,
        coerceCredentialPatch(body.credentials)
      );
      await this.testConnection.execute(merged);
      await this.installations.updateCredentials(userId, installationId, merged);
    }
    if (
      body.keepOcrText !== undefined ||
      body.rerunOcr !== undefined ||
      body.includeArchivedPdf !== undefined
    ) {
      const current = (await this.imports.getInstallationSettings(installationId, userId)) ?? {
        keepOcrText: true,
        rerunOcr: false,
        includeArchivedPdf: false,
      };
      await this.imports.updateInstallationSettings(installationId, userId, {
        keepOcrText: body.keepOcrText ?? current.keepOcrText,
        rerunOcr: body.rerunOcr ?? current.rerunOcr,
        includeArchivedPdf: body.includeArchivedPdf ?? current.includeArchivedPdf,
      });
    }
    if (body.displayName?.trim()) {
      await this.installations.updateDisplayName(userId, installationId, body.displayName.trim());
    }
  }
}

@Injectable()
export class PaperlessImportDryRunUseCase {
  constructor(
    private readonly runtime: ConnectorRuntimeResolver,
    private readonly executor: PaperlessImportExecutor
  ) {}

  async execute(userId: string, installationId: string): Promise<Record<string, unknown>> {
    const resolved = await this.runtime.resolve(userId, installationId);
    if (resolved.pluginId !== 'paperless') {
      throw new ValidationError('connectors.errors.sourceNotSupported');
    }
    return this.executor.dryRun(installationId, userId, resolved.credentials);
  }
}

@Injectable()
export class StartPaperlessImportUseCase {
  constructor(
    private readonly runtime: ConnectorRuntimeResolver,
    private readonly imports: PaperlessImportRepository,
    private readonly queue: PaperlessImportQueueService
  ) {}

  async execute(userId: string, installationId: string) {
    const resolved = await this.runtime.resolve(userId, installationId);
    if (resolved.pluginId !== 'paperless') {
      throw new ValidationError('connectors.errors.sourceNotSupported');
    }
    const active = await this.imports.findActiveRunForInstallation(installationId, userId);
    if (active) {
      throw new ConflictError('connectors.paperlessImport.runAlreadyActive');
    }
    const settings = await this.imports.getInstallationSettings(installationId, userId);
    const ocrMode: PaperlessOcrMode = settings?.rerunOcr ? 'rerun_docuvate' : 'keep_paperless';
    const watermark = await this.imports.getSyncWatermark(installationId);
    const run = await this.imports.createRun({
      installationId,
      ocrMode,
      includeArchivedPdf: settings?.includeArchivedPdf ?? false,
      incrementalModifiedGt: watermark,
    });
    await this.queue.enqueue(run.id, userId);
    return run;
  }
}

@Injectable()
export class GetPaperlessImportRunUseCase {
  constructor(private readonly imports: PaperlessImportRepository) {}

  async execute(userId: string, installationId: string, runId?: string) {
    if (runId) {
      const run = await this.imports.findRunForUser(runId, userId);
      if (!run || run.installationId !== installationId) {
        throw new NotFoundError('Import run');
      }
      const errors = await this.imports.listRunErrors(run.id);
      return { run, errors };
    }
    const run = await this.imports.findLatestRunForInstallation(installationId, userId);
    if (!run) {
      throw new NotFoundError('Import run');
    }
    const errors = await this.imports.listRunErrors(run.id);
    return { run, errors };
  }
}
